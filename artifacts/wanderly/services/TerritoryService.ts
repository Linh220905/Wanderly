/**
 * Territory Zone & Mystery Hike System for Wanderly.
 *
 * Implements Mystery Hike exploration quests:
 * - Generates daily territory sectors around the user's base position.
 * - Tracks territory exploration percentages (% sương mù giải tỏa từng vùng).
 * - Spawns Mystery Hike destination trails with cryptic clues & radar guidance.
 */

import { MapCoordinate, TerritoryZone, MysteryHikeQuest } from '@/models/types';

export function metersBetweenCoords(a: MapCoordinate, b: MapCoordinate): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// ── Territory Generation (Đà Nẵng / Local Centric) ───────────

interface TerritoryPreset {
  name: string;
  nameVi: string;
  type: TerritoryZone['type'];
  color: string;
  dLat: number;
  dLon: number;
  radiusMeters: number;
  totalCells: number;
}

const TERRITORY_PRESETS: TerritoryPreset[] = [
  {
    name: 'Downtown Boulevard',
    nameVi: 'Khu Phố Trung Tâm',
    type: 'urban',
    color: '#3B82F6',
    dLat: 0.002,
    dLon: 0.0015,
    radiusMeters: 480,
    totalCells: 150,
  },
  {
    name: 'Dragon Waterfront',
    nameVi: 'Vành Đai Bờ Sông',
    type: 'waterfront',
    color: '#06B6D4',
    dLat: -0.0035,
    dLon: 0.0042,
    radiusMeters: 620,
    totalCells: 220,
  },
  {
    name: 'Old Heritage Quarter',
    nameVi: 'Khu Di Tích Cổ',
    type: 'heritage',
    color: '#F59E0B',
    dLat: -0.004,
    dLon: -0.003,
    radiusMeters: 450,
    totalCells: 130,
  },
  {
    name: 'Green Botanic Park',
    nameVi: 'Công Viên Sinh Thái',
    type: 'park',
    color: '#10B981',
    dLat: 0.0045,
    dLon: -0.0025,
    radiusMeters: 520,
    totalCells: 180,
  },
];

export function generateTerritories(
  userLocation: MapCoordinate,
  revealedRoute: MapCoordinate[],
): TerritoryZone[] {
  return TERRITORY_PRESETS.map((preset, idx) => {
    const center: MapCoordinate = {
      latitude: userLocation.latitude + preset.dLat,
      longitude: userLocation.longitude + preset.dLon,
    };

    // Calculate how many revealed route points fall inside this territory
    let pointsInZone = 0;
    for (let i = 0; i < revealedRoute.length; i++) {
      if (metersBetweenCoords(revealedRoute[i], center) <= preset.radiusMeters) {
        pointsInZone++;
      }
    }

    // Rough conversion: each point ~ 10m explored
    const estimatedCells = Math.min(preset.totalCells, Math.floor(pointsInZone / 2));
    const percent = Math.min(100, Math.round((estimatedCells / preset.totalCells) * 100));

    return {
      id: `territory-${idx + 1}`,
      name: preset.name,
      nameVi: preset.nameVi,
      type: preset.type,
      color: preset.color,
      center,
      radiusMeters: preset.radiusMeters,
      explorationPercent: percent,
      totalCells: preset.totalCells,
      revealedCells: estimatedCells,
      isUnlocked: percent >= 80,
      guardianBadge: `badge-territory-${idx + 1}`,
    };
  });
}

// ── Mystery Hike Quest Generator ─────────────────────────────

interface MysteryClueTemplate {
  title: string;
  titleVi: string;
  clue: string;
  clueVi: string;
  dLat: number;
  dLon: number;
  radiusMeters: number;
  rewardXP: number;
  rewardCoins: number;
}

const MYSTERY_CLUES: MysteryClueTemplate[] = [
  {
    title: 'The Whispering Shrine',
    titleVi: 'Bí Ẩn Đền Gió Thì Thầm',
    clue: 'Search where the twin ancient banyan trees overlook the quiet river bend.',
    clueVi: 'Tìm về nơi hai gốc đa cổ thụ soi bóng xuống khúc uốn của dòng sông vắng.',
    dLat: 0.0035, // ~380m North-East
    dLon: 0.0028,
    radiusMeters: 30,
    rewardXP: 180,
    rewardCoins: 120,
  },
  {
    title: 'Echoes of the Old Pier',
    titleVi: 'Dấu Tích Bến Tàu Cổ',
    clue: 'Follow the eastern breeze until you reach the forgotten stone harbor beacon.',
    clueVi: 'Đi theo làn gió hướng đông đến ngọn hải đăng bằng đá bị lãng quên bên bến cảng.',
    dLat: -0.0032, // ~420m South-East
    dLon: 0.0038,
    radiusMeters: 35,
    rewardXP: 220,
    rewardCoins: 150,
  },
  {
    title: 'The Hidden Sunken Garden',
    titleVi: 'Vườn Địa Đàng Ẩn Giấu',
    clue: 'Find the secluded paved courtyard where golden flowers bloom behind stone arches.',
    clueVi: 'Khám phá khoảng sân lát gạch ẩn mình sau những vòm đá nơi hoa hoàng yến nở rộ.',
    dLat: 0.0028, // ~400m North-West
    dLon: -0.0034,
    radiusMeters: 30,
    rewardXP: 200,
    rewardCoins: 130,
  },
];

export function generateDailyMysteryHike(
  userLocation: MapCoordinate,
  completedIds: string[] = [],
): MysteryHikeQuest {
  const today = new Date().toISOString().split('T')[0];
  const dayIndex = new Date().getDate() % MYSTERY_CLUES.length;
  const template = MYSTERY_CLUES[dayIndex];

  const targetCoordinate: MapCoordinate = {
    latitude: userLocation.latitude + template.dLat,
    longitude: userLocation.longitude + template.dLon,
  };

  const distMeters = metersBetweenCoords(userLocation, targetCoordinate);
  const distanceKm = Math.round((distMeters / 1000) * 10) / 10;
  const questId = `mystery-hike-${today}`;
  const isCompleted = completedIds.includes(questId);

  // Set expiration to end of current day (23:59:59)
  const tomorrow = new Date();
  tomorrow.setHours(23, 59, 59, 999);

  return {
    id: questId,
    title: template.title,
    titleVi: template.titleVi,
    clue: template.clue,
    clueVi: template.clueVi,
    targetCoordinate,
    targetRadiusMeters: template.radiusMeters,
    distanceKm: Math.max(0.5, distanceKm),
    territoryId: `territory-${(dayIndex % 4) + 1}`,
    reward: {
      xp: template.rewardXP,
      coins: template.rewardCoins,
      exclusiveBadgeId: 'mystery_master',
    },
    isActive: true,
    isCompleted,
    completedAt: isCompleted ? today : null,
    expiresAt: tomorrow.toISOString(),
  };
}

export function checkMysteryHikeArrival(
  userLocation: MapCoordinate,
  quest: MysteryHikeQuest | null,
): boolean {
  if (!quest || quest.isCompleted) return false;
  const dist = metersBetweenCoords(userLocation, quest.targetCoordinate);
  return dist <= quest.targetRadiusMeters;
}
