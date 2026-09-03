/**
 * Typed AsyncStorage helpers for Wanderly.
 *
 * All app persistence goes through this module so we have a single
 * place to control serialization, error handling, and key naming.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { type AppState, type ExplorationSession, type MapCoordinate, DEFAULT_APP_STATE } from '@/models/types';

const KEYS = {
  appState: 'wanderly-app-state',
  sessions: 'wanderly-sessions',
  revealedRoute: 'wanderly-revealed-route',
  missions: 'wanderly-missions',
  badges: 'wanderly-badges',
} as const;

// ── Generic helpers ───────────────────────────────────────

async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail — local storage full or corrupt
  }
}

// ── App State ─────────────────────────────────────────────

export async function loadAppState(): Promise<AppState> {
  const saved = await getJSON<AppState>(KEYS.appState);
  if (!saved) return DEFAULT_APP_STATE;

  // Merge with defaults to handle schema migrations gracefully
  return {
    ...DEFAULT_APP_STATE,
    ...saved,
    profile: { ...DEFAULT_APP_STATE.profile, ...saved.profile },
  };
}

export async function saveAppState(state: AppState): Promise<void> {
  await setJSON(KEYS.appState, state);
}

// ── Sessions ──────────────────────────────────────────────

export async function loadSessions(): Promise<ExplorationSession[]> {
  return (await getJSON<ExplorationSession[]>(KEYS.sessions)) ?? [];
}

export async function saveSessions(sessions: ExplorationSession[]): Promise<void> {
  await setJSON(KEYS.sessions, sessions);
}

export async function addSession(session: ExplorationSession): Promise<ExplorationSession[]> {
  const sessions = await loadSessions();
  sessions.unshift(session); // newest first
  await saveSessions(sessions);
  return sessions;
}

export async function deleteSession(id: string): Promise<ExplorationSession[]> {
  const sessions = await loadSessions();
  const filtered = sessions.filter(s => s.id !== id);
  await saveSessions(filtered);
  return filtered;
}

// ── Revealed Route ────────────────────────────────────────

export async function loadRevealedRoute(): Promise<MapCoordinate[]> {
  return (await getJSON<MapCoordinate[]>(KEYS.revealedRoute)) ?? [];
}

export async function saveRevealedRoute(route: MapCoordinate[]): Promise<void> {
  await setJSON(KEYS.revealedRoute, route);
}

export async function appendToRevealedRoute(newPoints: MapCoordinate[]): Promise<void> {
  const existing = await loadRevealedRoute();
  await saveRevealedRoute([...existing, ...newPoints]);
}

// ── Clear All ─────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

// ── Generate unique ID ───────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
