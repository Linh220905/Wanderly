/**
 * Core data models for Wanderly.
 */

// ── User Profile ──────────────────────────────────────────

export type ExplorerType = 'trailSeeker' | 'rewardHunter' | 'cityPathfinder' | 'consistencyBuilder';

export interface UserProfile {
  /** Display name */
  name: string;
  /** Signed-in provider or null for guest */
  authProvider: 'apple' | 'google' | 'email' | null;
  /** Explorer type determined during onboarding */
  explorerType: ExplorerType;
  /** Whether user has premium */
  premium: boolean;
  /** Onboarding answers for reference */
  onboardingAnswers: string[][];

  // Gamification
  xp: number;
  level: number;
  coins: number;
  streak: number;
  lastActiveDate: string | null; // ISO date string "YYYY-MM-DD"

  // Cumulative stats
  totalDistance: number; // meters
  totalSessions: number;
  totalExplored: number; // cells
  totalCheckpoints: number;

  // Preferences
  units: 'metric' | 'imperial';
  fogColor: string;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
}

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Explorer',
  authProvider: null,
  explorerType: 'consistencyBuilder',
  premium: false,
  onboardingAnswers: Array.from({ length: 10 }, () => []),
  xp: 0,
  level: 1,
  coins: 0,
  streak: 0,
  lastActiveDate: null,
  totalDistance: 0,
  totalSessions: 0,
  totalExplored: 0,
  totalCheckpoints: 0,
  units: 'metric',
  fogColor: '#0C6B70',
  hapticsEnabled: true,
  notificationsEnabled: true,
};

// ── Exploration Session ───────────────────────────────────

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface ExplorationSession {
  id: string;
  date: string; // ISO date "YYYY-MM-DD"
  startedAt: string; // ISO datetime
  endedAt: string; // ISO datetime
  duration: number; // seconds
  distance: number; // meters
  cellsRevealed: number;
  route: MapCoordinate[];
  xpEarned: number;
  coinsEarned: number;
  checkpointsDiscovered: string[];
  activityType: 'walk' | 'run' | 'hike';
}

// ── Missions ──────────────────────────────────────────────

export type MissionType =
  | 'moveDistance'
  | 'exploreCells'
  | 'completeSessions'
  | 'maintainStreak'
  | 'discoverCheckpoint'
  | 'weeklyDistance'
  | 'weeklyExplore';

export type MissionFrequency = 'daily' | 'weekly';

export interface Mission {
  id: string;
  type: MissionType;
  frequency: MissionFrequency;
  title: string; // localization key or interpolated
  target: number;
  current: number;
  reward: { type: 'xp' | 'coins' | 'badge'; amount: number; badgeId?: string };
  claimed: boolean;
  generatedDate: string; // ISO date for daily reset
}

// ── Badges ────────────────────────────────────────────────

export type BadgeCategory = 'explorer' | 'consistency' | 'discovery' | 'special';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  icon: string; // Feather icon name
  category: BadgeCategory;
  rarity: BadgeRarity;
  condition: BadgeCondition;
  unlocked: boolean;
  unlockedAt: string | null; // ISO datetime
}

export type BadgeCondition =
  | { type: 'sessions'; count: number }
  | { type: 'distance'; meters: number }
  | { type: 'explored'; cells: number }
  | { type: 'streak'; days: number }
  | { type: 'checkpoints'; count: number }
  | { type: 'level'; level: number }
  | { type: 'missions'; count: number };

// ── Checkpoints ───────────────────────────────────────────

export type CheckpointType = 'landmark' | 'cache' | 'fragment' | 'mystery';

export interface Checkpoint {
  id: string;
  type: CheckpointType;
  title: string;
  coordinate: MapCoordinate;
  reward: { type: 'xp' | 'coins'; amount: number };
  discovered: boolean;
  discoveredAt: string | null;
}

// ── App State (persisted) ─────────────────────────────────

export type AppGate = 'welcome' | 'questions' | 'summary' | 'paywall' | 'auth' | 'location' | 'main';

export interface AppState {
  gate: AppGate;
  questionIndex: number;
  profile: UserProfile;
  sessions: ExplorationSession[];
  missions: Mission[];
  badges: Badge[];
  discoveredCheckpoints: string[];
  revealedRoute: MapCoordinate[];
}

export const DEFAULT_APP_STATE: AppState = {
  gate: 'welcome',
  questionIndex: 0,
  profile: DEFAULT_PROFILE,
  sessions: [],
  missions: [],
  badges: [],
  discoveredCheckpoints: [],
  revealedRoute: [],
};

// ── Level Thresholds ──────────────────────────────────────

export const LEVEL_THRESHOLDS = [
  0,     // Level 1
  500,   // Level 2
  1200,  // Level 3
  2500,  // Level 4
  4500,  // Level 5
  7500,  // Level 6
  11500, // Level 7
  17000, // Level 8
  24000, // Level 9
  33000, // Level 10
  45000, // Level 11
  60000, // Level 12
  80000, // Level 13
  105000,// Level 14
  140000,// Level 15
];

export function getLevelForXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2;
  return LEVEL_THRESHOLDS[level]; // level is 1-indexed, array is 0-indexed
}
