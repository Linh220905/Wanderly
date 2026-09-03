/**
 * Mission system for Wanderly.
 *
 * Generates daily and weekly missions based on user level.
 * Missions auto-reset at midnight (daily) and Monday (weekly).
 */

import { type Mission, type MissionType, type UserProfile } from '@/models/types';
import { generateId } from '@/utils/storage';

// ── Mission Templates ─────────────────────────────────────

interface MissionTemplate {
  type: MissionType;
  frequency: 'daily' | 'weekly';
  baseTarget: number;
  levelScale: number; // multiply by level
  reward: { type: 'xp' | 'coins'; baseAmount: number };
}

const DAILY_TEMPLATES: MissionTemplate[] = [
  { type: 'moveDistance', frequency: 'daily', baseTarget: 1500, levelScale: 200, reward: { type: 'xp', baseAmount: 40 } },
  { type: 'exploreCells', frequency: 'daily', baseTarget: 8, levelScale: 2, reward: { type: 'coins', baseAmount: 60 } },
  { type: 'completeSessions', frequency: 'daily', baseTarget: 1, levelScale: 0, reward: { type: 'xp', baseAmount: 30 } },
  { type: 'maintainStreak', frequency: 'daily', baseTarget: 1, levelScale: 0, reward: { type: 'coins', baseAmount: 25 } },
  { type: 'discoverCheckpoint', frequency: 'daily', baseTarget: 1, levelScale: 0, reward: { type: 'xp', baseAmount: 50 } },
];

const WEEKLY_TEMPLATES: MissionTemplate[] = [
  { type: 'weeklyDistance', frequency: 'weekly', baseTarget: 10000, levelScale: 1500, reward: { type: 'xp', baseAmount: 150 } },
  { type: 'weeklyExplore', frequency: 'weekly', baseTarget: 50, levelScale: 10, reward: { type: 'coins', baseAmount: 200 } },
  { type: 'completeSessions', frequency: 'weekly', baseTarget: 3, levelScale: 1, reward: { type: 'xp', baseAmount: 100 } },
  { type: 'maintainStreak', frequency: 'weekly', baseTarget: 5, levelScale: 1, reward: { type: 'coins', baseAmount: 150 } },
];

// ── Deterministic seed for consistent daily missions ──────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function dateToSeed(date: string): number {
  return date.split('-').reduce((acc, part) => acc * 100 + parseInt(part, 10), 0);
}

// ── Mission Generation ────────────────────────────────────

function generateMissionFromTemplate(
  template: MissionTemplate,
  profile: UserProfile,
  dateStr: string,
): Mission {
  const target = Math.round(template.baseTarget + template.levelScale * (profile.level - 1));
  const rewardAmount = Math.round(template.reward.baseAmount * (1 + (profile.level - 1) * 0.15));

  return {
    id: generateId(),
    type: template.type,
    frequency: template.frequency,
    title: template.type, // Will be resolved via i18n in UI
    target,
    current: 0,
    reward: { type: template.reward.type, amount: rewardAmount },
    claimed: false,
    generatedDate: dateStr,
  };
}

export function generateDailyMissions(profile: UserProfile): Mission[] {
  const today = new Date().toISOString().split('T')[0];
  const rand = seededRandom(dateToSeed(today));

  // Pick 3 random daily missions
  const shuffled = [...DAILY_TEMPLATES].sort(() => rand() - 0.5);
  const selected = shuffled.slice(0, 3);

  return selected.map(template => generateMissionFromTemplate(template, profile, today));
}

export function generateWeeklyMissions(profile: UserProfile): Mission[] {
  const today = new Date();
  // Get Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekStr = monday.toISOString().split('T')[0];

  const rand = seededRandom(dateToSeed(weekStr));
  const shuffled = [...WEEKLY_TEMPLATES].sort(() => rand() - 0.5);
  const selected = shuffled.slice(0, 2);

  return selected.map(template => generateMissionFromTemplate(template, profile, weekStr));
}

// ── Mission Progress Update ───────────────────────────────

export function updateMissionProgress(
  missions: Mission[],
  profile: UserProfile,
  sessionDistance: number,
  sessionCells: number,
  sessionCheckpoints: number,
): Mission[] {
  const today = new Date().toISOString().split('T')[0];

  return missions.map(mission => {
    if (mission.claimed) return mission;

    let current = mission.current;

    switch (mission.type) {
      case 'moveDistance':
        current += sessionDistance;
        break;
      case 'exploreCells':
        current += sessionCells;
        break;
      case 'completeSessions':
        current += 1;
        break;
      case 'maintainStreak':
        current = profile.streak;
        break;
      case 'discoverCheckpoint':
        current += sessionCheckpoints;
        break;
      case 'weeklyDistance':
        current += sessionDistance;
        break;
      case 'weeklyExplore':
        current += sessionCells;
        break;
    }

    return { ...mission, current: Math.min(current, mission.target) };
  });
}

// ── Mission Refresh Check ─────────────────────────────────

export function shouldRefreshDailyMissions(missions: Mission[]): boolean {
  const today = new Date().toISOString().split('T')[0];
  const dailyMissions = missions.filter(m => m.frequency === 'daily');
  if (dailyMissions.length === 0) return true;
  return dailyMissions[0].generatedDate !== today;
}

export function shouldRefreshWeeklyMissions(missions: Mission[]): boolean {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekStr = monday.toISOString().split('T')[0];

  const weeklyMissions = missions.filter(m => m.frequency === 'weekly');
  if (weeklyMissions.length === 0) return true;
  return weeklyMissions[0].generatedDate !== weekStr;
}

// ── Time until refresh ────────────────────────────────────

export function timeUntilDailyRefresh(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export function timeUntilWeeklyRefresh(): string {
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);
  const diff = nextMonday.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return `${days}d ${hours}h`;
}

// ── Mission Display Helper ────────────────────────────────

export function getMissionDisplayValues(mission: Mission): {
  templateKey: string;
  templateVars: Record<string, string | number>;
  progressPercent: number;
  isComplete: boolean;
} {
  const progressPercent = mission.target > 0 ? Math.round((mission.current / mission.target) * 100) : 0;
  const isComplete = mission.current >= mission.target;

  const vars: Record<string, string | number> = {};

  switch (mission.type) {
    case 'moveDistance':
      vars.distance = (mission.target / 1000).toFixed(1);
      break;
    case 'exploreCells':
    case 'weeklyExplore':
      vars.count = mission.target;
      break;
    case 'completeSessions':
      vars.count = mission.target;
      break;
    case 'maintainStreak':
      vars.count = mission.target;
      break;
    case 'weeklyDistance':
      vars.distance = (mission.target / 1000).toFixed(0);
      break;
    default:
      break;
  }

  return {
    templateKey: mission.type,
    templateVars: vars,
    progressPercent: Math.min(100, progressPercent),
    isComplete,
  };
}
