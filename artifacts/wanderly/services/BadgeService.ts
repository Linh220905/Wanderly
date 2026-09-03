/**
 * Badge system for Wanderly.
 *
 * Defines 20+ badges across 4 categories with progressive unlock conditions.
 * Badges are checked after each session completion.
 */

import { type Badge, type BadgeCategory, type BadgeCondition, type BadgeRarity, type UserProfile } from '@/models/types';

// ── Badge Definitions ─────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  descriptionVi: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  condition: BadgeCondition;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Explorer category
  {
    id: 'first-steps', name: 'First Steps', nameVi: 'Bước Đầu Tiên',
    description: 'Complete your first exploration session', descriptionVi: 'Hoàn thành buổi khám phá đầu tiên',
    icon: 'award', category: 'explorer', rarity: 'common',
    condition: { type: 'sessions', count: 1 },
  },
  {
    id: 'pathfinder', name: 'Pathfinder', nameVi: 'Người Mở Đường',
    description: 'Complete 10 exploration sessions', descriptionVi: 'Hoàn thành 10 buổi khám phá',
    icon: 'compass', category: 'explorer', rarity: 'rare',
    condition: { type: 'sessions', count: 10 },
  },
  {
    id: 'veteran-explorer', name: 'Veteran Explorer', nameVi: 'Thám Hiểm Kỳ Cựu',
    description: 'Complete 50 exploration sessions', descriptionVi: 'Hoàn thành 50 buổi khám phá',
    icon: 'star', category: 'explorer', rarity: 'epic',
    condition: { type: 'sessions', count: 50 },
  },
  {
    id: 'legend', name: 'Living Legend', nameVi: 'Huyền Thoại Sống',
    description: 'Complete 200 exploration sessions', descriptionVi: 'Hoàn thành 200 buổi khám phá',
    icon: 'zap', category: 'explorer', rarity: 'legendary',
    condition: { type: 'sessions', count: 200 },
  },
  {
    id: 'first-km', name: 'First Kilometer', nameVi: 'Km Đầu Tiên',
    description: 'Travel 1 km total', descriptionVi: 'Đi được tổng cộng 1 km',
    icon: 'navigation', category: 'explorer', rarity: 'common',
    condition: { type: 'distance', meters: 1000 },
  },
  {
    id: 'marathon', name: 'Marathon Runner', nameVi: 'Vận Động Viên Marathon',
    description: 'Travel 42 km total', descriptionVi: 'Đi được tổng cộng 42 km',
    icon: 'trending-up', category: 'explorer', rarity: 'rare',
    condition: { type: 'distance', meters: 42000 },
  },
  {
    id: 'century', name: 'Century Club', nameVi: 'Câu Lạc Bộ 100',
    description: 'Travel 100 km total', descriptionVi: 'Đi được tổng cộng 100 km',
    icon: 'flag', category: 'explorer', rarity: 'epic',
    condition: { type: 'distance', meters: 100000 },
  },

  // Consistency category
  {
    id: 'streak-3', name: 'Getting Started', nameVi: 'Khởi Đầu',
    description: 'Maintain a 3-day streak', descriptionVi: 'Duy trì chuỗi 3 ngày',
    icon: 'sunrise', category: 'consistency', rarity: 'common',
    condition: { type: 'streak', days: 3 },
  },
  {
    id: 'streak-7', name: 'Week Warrior', nameVi: 'Chiến Binh Tuần',
    description: 'Maintain a 7-day streak', descriptionVi: 'Duy trì chuỗi 7 ngày',
    icon: 'calendar', category: 'consistency', rarity: 'rare',
    condition: { type: 'streak', days: 7 },
  },
  {
    id: 'streak-30', name: 'Monthly Master', nameVi: 'Bậc Thầy Tháng',
    description: 'Maintain a 30-day streak', descriptionVi: 'Duy trì chuỗi 30 ngày',
    icon: 'shield', category: 'consistency', rarity: 'epic',
    condition: { type: 'streak', days: 30 },
  },
  {
    id: 'streak-100', name: 'Unstoppable', nameVi: 'Không Thể Ngăn Cản',
    description: 'Maintain a 100-day streak', descriptionVi: 'Duy trì chuỗi 100 ngày',
    icon: 'battery-charging', category: 'consistency', rarity: 'legendary',
    condition: { type: 'streak', days: 100 },
  },

  // Discovery category
  {
    id: 'fog-cutter', name: 'Fog Cutter', nameVi: 'Người Xé Sương',
    description: 'Reveal 50 map cells', descriptionVi: 'Khám phá 50 ô bản đồ',
    icon: 'wind', category: 'discovery', rarity: 'common',
    condition: { type: 'explored', cells: 50 },
  },
  {
    id: 'cartographer', name: 'Cartographer', nameVi: 'Nhà Bản Đồ Học',
    description: 'Reveal 500 map cells', descriptionVi: 'Khám phá 500 ô bản đồ',
    icon: 'map', category: 'discovery', rarity: 'rare',
    condition: { type: 'explored', cells: 500 },
  },
  {
    id: 'world-mapper', name: 'World Mapper', nameVi: 'Người Vẽ Thế Giới',
    description: 'Reveal 2000 map cells', descriptionVi: 'Khám phá 2000 ô bản đồ',
    icon: 'globe', category: 'discovery', rarity: 'epic',
    condition: { type: 'explored', cells: 2000 },
  },
  {
    id: 'cache-finder', name: 'Cache Finder', nameVi: 'Thợ Tìm Kho Báu',
    description: 'Discover 5 checkpoints', descriptionVi: 'Khám phá 5 điểm kiểm tra',
    icon: 'gift', category: 'discovery', rarity: 'common',
    condition: { type: 'checkpoints', count: 5 },
  },
  {
    id: 'treasure-hunter', name: 'Treasure Hunter', nameVi: 'Thợ Săn Kho Báu',
    description: 'Discover 25 checkpoints', descriptionVi: 'Khám phá 25 điểm kiểm tra',
    icon: 'package', category: 'discovery', rarity: 'rare',
    condition: { type: 'checkpoints', count: 25 },
  },
  {
    id: 'relic-collector', name: 'Relic Collector', nameVi: 'Nhà Sưu Tập Cổ Vật',
    description: 'Discover 100 checkpoints', descriptionVi: 'Khám phá 100 điểm kiểm tra',
    icon: 'hexagon', category: 'discovery', rarity: 'epic',
    condition: { type: 'checkpoints', count: 100 },
  },

  // Special category
  {
    id: 'level-5', name: 'Rising Star', nameVi: 'Ngôi Sao Mới',
    description: 'Reach Explorer Level 5', descriptionVi: 'Đạt Nhà Thám Hiểm Cấp 5',
    icon: 'sun', category: 'special', rarity: 'rare',
    condition: { type: 'level', level: 5 },
  },
  {
    id: 'level-10', name: 'Elite Explorer', nameVi: 'Thám Hiểm Tinh Hoa',
    description: 'Reach Explorer Level 10', descriptionVi: 'Đạt Nhà Thám Hiểm Cấp 10',
    icon: 'award', category: 'special', rarity: 'epic',
    condition: { type: 'level', level: 10 },
  },
  {
    id: 'level-15', name: 'Apex Wanderer', nameVi: 'Đỉnh Cao Lữ Hành',
    description: 'Reach Explorer Level 15', descriptionVi: 'Đạt Nhà Thám Hiểm Cấp 15',
    icon: 'target', category: 'special', rarity: 'legendary',
    condition: { type: 'level', level: 15 },
  },
];

// ── Badge Initialization ──────────────────────────────────

export function initializeBadges(): Badge[] {
  return BADGE_DEFINITIONS.map(def => ({
    ...def,
    unlocked: false,
    unlockedAt: null,
  }));
}

// ── Badge Check ───────────────────────────────────────────

export function checkBadgeUnlocks(badges: Badge[], profile: UserProfile): { updatedBadges: Badge[]; newlyUnlocked: Badge[] } {
  const newlyUnlocked: Badge[] = [];

  const updatedBadges = badges.map(badge => {
    if (badge.unlocked) return badge;

    let shouldUnlock = false;

    switch (badge.condition.type) {
      case 'sessions':
        shouldUnlock = profile.totalSessions >= badge.condition.count;
        break;
      case 'distance':
        shouldUnlock = profile.totalDistance >= badge.condition.meters;
        break;
      case 'explored':
        shouldUnlock = profile.totalExplored >= badge.condition.cells;
        break;
      case 'streak':
        shouldUnlock = profile.streak >= badge.condition.days;
        break;
      case 'checkpoints':
        shouldUnlock = profile.totalCheckpoints >= badge.condition.count;
        break;
      case 'level':
        shouldUnlock = profile.level >= badge.condition.level;
        break;
      case 'missions':
        // Will be tracked separately
        break;
    }

    if (shouldUnlock) {
      const unlocked = { ...badge, unlocked: true, unlockedAt: new Date().toISOString() };
      newlyUnlocked.push(unlocked);
      return unlocked;
    }

    return badge;
  });

  return { updatedBadges, newlyUnlocked };
}

// ── Badge Progress ────────────────────────────────────────

export function getBadgeProgress(badge: Badge, profile: UserProfile): number {
  if (badge.unlocked) return 1;

  switch (badge.condition.type) {
    case 'sessions':
      return Math.min(1, profile.totalSessions / badge.condition.count);
    case 'distance':
      return Math.min(1, profile.totalDistance / badge.condition.meters);
    case 'explored':
      return Math.min(1, profile.totalExplored / badge.condition.cells);
    case 'streak':
      return Math.min(1, profile.streak / badge.condition.days);
    case 'checkpoints':
      return Math.min(1, profile.totalCheckpoints / badge.condition.count);
    case 'level':
      return Math.min(1, profile.level / badge.condition.level);
    default:
      return 0;
  }
}
