/**
 * Gamification engine for Wanderly.
 *
 * Handles XP calculation, level progression, streak management,
 * and coin rewards.
 */

import { type ExplorationSession, type UserProfile, getLevelForXP, getXPForNextLevel, LEVEL_THRESHOLDS } from '@/models/types';

// ── XP Rewards ────────────────────────────────────────────

const XP_PER_KM = 15;
const XP_PER_CELL = 3;
const XP_PER_CHECKPOINT = 50;
const XP_PER_SESSION_COMPLETE = 20;
const XP_STREAK_BONUS_PER_DAY = 5; // bonus per streak day (capped at 50)

const COINS_PER_KM = 8;
const COINS_PER_CHECKPOINT = 30;
const COINS_SESSION_BASE = 15;

// ── Level Titles ──────────────────────────────────────────

export const LEVEL_TITLES: Record<number, { en: string; vi: string }> = {
  1: { en: 'Novice Explorer', vi: 'Thám Hiểm Tập Sự' },
  2: { en: 'Trail Walker', vi: 'Người Đi Bộ' },
  3: { en: 'Path Finder', vi: 'Người Tìm Đường' },
  4: { en: 'Fog Breaker', vi: 'Người Phá Sương' },
  5: { en: 'City Scout', vi: 'Hướng Đạo Thành Phố' },
  6: { en: 'Map Maker', vi: 'Nhà Bản Đồ' },
  7: { en: 'Terrain Master', vi: 'Bậc Thầy Địa Hình' },
  8: { en: 'World Revealer', vi: 'Người Khám Phá Thế Giới' },
  9: { en: 'Legend Walker', vi: 'Huyền Thoại Đường Dài' },
  10: { en: 'Wanderly Elite', vi: 'Tinh Hoa Wanderly' },
  11: { en: 'Grand Explorer', vi: 'Đại Thám Hiểm' },
  12: { en: 'Mythic Traveler', vi: 'Lữ Khách Thần Thoại' },
  13: { en: 'Celestial Pioneer', vi: 'Tiên Phong Thiên Thể' },
  14: { en: 'Eternal Wanderer', vi: 'Lữ Nhân Bất Tử' },
  15: { en: 'Apex Explorer', vi: 'Đỉnh Cao Thám Hiểm' },
};

export function getLevelTitle(level: number, locale: 'en' | 'vi'): string {
  const entry = LEVEL_TITLES[Math.min(level, 15)];
  return entry?.[locale] ?? LEVEL_TITLES[1][locale];
}

// ── Session Rewards ───────────────────────────────────────

export interface SessionRewards {
  xp: number;
  coins: number;
  streakBonus: number;
  levelBefore: number;
  levelAfter: number;
  didLevelUp: boolean;
}

export function calculateSessionRewards(
  session: Omit<ExplorationSession, 'id' | 'xpEarned' | 'coinsEarned'>,
  profile: UserProfile,
): SessionRewards {
  const distanceKm = session.distance / 1000;

  // Base XP
  let xp = XP_PER_SESSION_COMPLETE;
  xp += Math.round(distanceKm * XP_PER_KM);
  xp += session.cellsRevealed * XP_PER_CELL;
  xp += session.checkpointsDiscovered.length * XP_PER_CHECKPOINT;

  // Streak bonus
  const streakBonus = Math.min(profile.streak * XP_STREAK_BONUS_PER_DAY, 50);
  xp += streakBonus;

  // Coins
  let coins = COINS_SESSION_BASE;
  coins += Math.round(distanceKm * COINS_PER_KM);
  coins += session.checkpointsDiscovered.length * COINS_PER_CHECKPOINT;

  const levelBefore = profile.level;
  const levelAfter = getLevelForXP(profile.xp + xp);
  const didLevelUp = levelAfter > levelBefore;

  return { xp, coins, streakBonus, levelBefore, levelAfter, didLevelUp };
}

// ── Streak Logic ──────────────────────────────────────────

export function calculateStreak(profile: UserProfile): { newStreak: number; streakBroken: boolean } {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (profile.lastActiveDate === today) {
    return { newStreak: profile.streak, streakBroken: false };
  }
  if (profile.lastActiveDate === yesterday) {
    return { newStreak: profile.streak + 1, streakBroken: false };
  }
  return { newStreak: 1, streakBroken: profile.streak > 0 };
}

// ── Level Progress ────────────────────────────────────────

export function getLevelProgress(xp: number): { current: number; target: number; progress: number } {
  const level = getLevelForXP(xp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = getXPForNextLevel(level);
  const current = xp - currentThreshold;
  const target = nextThreshold - currentThreshold;
  const progress = target > 0 ? Math.min(1, current / target) : 1;
  return { current, target, progress };
}
