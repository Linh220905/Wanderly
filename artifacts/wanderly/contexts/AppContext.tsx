/**
 * Global application context for Wanderly.
 *
 * Provides centralized app state, profile, and actions to all screens.
 * Replaces the previous prop-drilling pattern from the monolithic index.tsx.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  type AppGate,
  type AppState,
  type Badge,
  type ExplorationSession,
  type MapCoordinate,
  type Mission,
  type UserProfile,
  DEFAULT_APP_STATE,
  getLevelForXP,
} from '@/models/types';
import { loadAppState, saveAppState, generateId, addSession as addSessionToStorage, appendToRevealedRoute } from '@/utils/storage';

// ── Actions ───────────────────────────────────────────────

type Action =
  | { type: 'LOAD'; state: AppState }
  | { type: 'SET_GATE'; gate: AppGate }
  | { type: 'SET_QUESTION_INDEX'; index: number }
  | { type: 'SET_ANSWER'; questionIndex: number; answers: string[] }
  | { type: 'SET_PREMIUM'; premium: boolean }
  | { type: 'UPDATE_PROFILE'; updates: Partial<UserProfile> }
  | { type: 'ADD_XP'; amount: number }
  | { type: 'ADD_COINS'; amount: number }
  | { type: 'UPDATE_STREAK' }
  | { type: 'ADD_SESSION'; session: ExplorationSession }
  | { type: 'SET_MISSIONS'; missions: Mission[] }
  | { type: 'CLAIM_MISSION'; missionId: string }
  | { type: 'SET_BADGES'; badges: Badge[] }
  | { type: 'UNLOCK_BADGE'; badgeId: string }
  | { type: 'DISCOVER_CHECKPOINT'; checkpointId: string }
  | { type: 'UPDATE_STATS'; distance: number; explored: number; checkpoints: number }
  | { type: 'APPEND_ROUTE'; points: MapCoordinate[] }
  | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD':
      return action.state;

    case 'SET_GATE':
      return { ...state, gate: action.gate };

    case 'SET_QUESTION_INDEX':
      return { ...state, questionIndex: action.index };

    case 'SET_ANSWER': {
      const answers = state.profile.onboardingAnswers.map((a, i) =>
        i === action.questionIndex ? action.answers : [...a],
      );
      return { ...state, profile: { ...state.profile, onboardingAnswers: answers } };
    }

    case 'SET_PREMIUM':
      return { ...state, profile: { ...state.profile, premium: action.premium } };

    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.updates } };

    case 'ADD_XP': {
      const newXP = state.profile.xp + action.amount;
      const newLevel = getLevelForXP(newXP);
      return {
        ...state,
        profile: { ...state.profile, xp: newXP, level: newLevel },
      };
    }

    case 'ADD_COINS':
      return { ...state, profile: { ...state.profile, coins: state.profile.coins + action.amount } };

    case 'UPDATE_STREAK': {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const last = state.profile.lastActiveDate;
      let newStreak = state.profile.streak;

      if (last === today) {
        // Already active today
      } else if (last === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1; // Reset streak
      }

      return {
        ...state,
        profile: { ...state.profile, streak: newStreak, lastActiveDate: today },
      };
    }

    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [action.session, ...state.sessions],
        profile: {
          ...state.profile,
          totalSessions: state.profile.totalSessions + 1,
          totalDistance: state.profile.totalDistance + action.session.distance,
          totalExplored: state.profile.totalExplored + action.session.cellsRevealed,
        },
      };

    case 'SET_MISSIONS':
      return { ...state, missions: action.missions };

    case 'CLAIM_MISSION':
      return {
        ...state,
        missions: state.missions.map(m =>
          m.id === action.missionId ? { ...m, claimed: true } : m,
        ),
      };

    case 'SET_BADGES':
      return { ...state, badges: action.badges };

    case 'UNLOCK_BADGE':
      return {
        ...state,
        badges: state.badges.map(b =>
          b.id === action.badgeId ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() } : b,
        ),
      };

    case 'DISCOVER_CHECKPOINT':
      return {
        ...state,
        discoveredCheckpoints: [...state.discoveredCheckpoints, action.checkpointId],
        profile: {
          ...state.profile,
          totalCheckpoints: state.profile.totalCheckpoints + 1,
        },
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        profile: {
          ...state.profile,
          totalDistance: state.profile.totalDistance + action.distance,
          totalExplored: state.profile.totalExplored + action.explored,
          totalCheckpoints: state.profile.totalCheckpoints + action.checkpoints,
        },
      };

    case 'APPEND_ROUTE':
      return {
        ...state,
        revealedRoute: [...state.revealedRoute, ...action.points],
      };

    case 'RESET':
      return DEFAULT_APP_STATE;

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  loaded: boolean;
  dispatch: React.Dispatch<Action>;

  // Convenience accessors
  profile: UserProfile;
  gate: AppGate;

  // High-level actions
  goToGate: (gate: AppGate) => void;
  completeSession: (session: Omit<ExplorationSession, 'id'>) => ExplorationSession;
  resetApp: () => void;
}

const AppContext = createContext<AppContextValue>(null as unknown as AppContextValue);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_APP_STATE);
  const [loaded, setLoaded] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    loadAppState().then(savedState => {
      dispatch({ type: 'LOAD', state: savedState });
      setLoaded(true);
    });
  }, []);

  // Auto-save state changes (debounced)
  useEffect(() => {
    if (!loaded) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveAppState(state);
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state, loaded]);

  const goToGate = useCallback((gate: AppGate) => {
    dispatch({ type: 'SET_GATE', gate });
  }, []);

  const completeSession = useCallback(
    (sessionData: Omit<ExplorationSession, 'id'>): ExplorationSession => {
      const session: ExplorationSession = { ...sessionData, id: generateId() };
      dispatch({ type: 'ADD_SESSION', session });
      dispatch({ type: 'ADD_XP', amount: session.xpEarned });
      dispatch({ type: 'ADD_COINS', amount: session.coinsEarned });
      dispatch({ type: 'UPDATE_STREAK' });
      if (session.route.length > 0) {
        appendToRevealedRoute(session.route).catch(() => {});
      }
      addSessionToStorage(session).catch(() => {});
      return session;
    },
    [],
  );

  const resetApp = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      loaded,
      dispatch,
      profile: state.profile,
      gate: state.gate,
      goToGate,
      completeSession,
      resetApp,
    }),
    [state, loaded, goToGate, completeSession, resetApp],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export { type Action, type AppContextValue };
