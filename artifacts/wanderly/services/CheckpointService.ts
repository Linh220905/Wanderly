/**
 * Checkpoint (POI) system for Wanderly.
 *
 * Generates checkpoints procedurally near the user's location.
 * Uses grid-based seeding so checkpoints stay consistent across sessions.
 */

import { type Checkpoint, type CheckpointType, type MapCoordinate } from '@/models/types';

export type { Checkpoint, CheckpointType };

// ── Constants ─────────────────────────────────────────────

const GRID_SIZE_DEGREES = 0.003; // ~330m grid cells
const CHECKPOINTS_PER_GRID = 2;
export const DISCOVERY_RADIUS_METERS = 25; // Proximity auto-collect within 25m
const MAX_VISIBLE_CHECKPOINTS = 15;
const GENERATE_RADIUS_DEGREES = 0.015; // ~1.5km around user

function metersBetweenCoords(a: MapCoordinate, b: MapCoordinate) {
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

// ── Types & Rewards ───────────────────────────────────────

export const CHECKPOINT_TYPES: { type: CheckpointType; weight: number; reward: { type: 'xp' | 'coins'; min: number; max: number }; icon: string }[] = [
  { type: 'landmark', weight: 20, reward: { type: 'xp', min: 50, max: 120 }, icon: '🏛️' },
  { type: 'cache', weight: 45, reward: { type: 'coins', min: 40, max: 80 }, icon: '🎁' },
  { type: 'fragment', weight: 25, reward: { type: 'xp', min: 60, max: 150 }, icon: '💎' },
  { type: 'mystery', weight: 10, reward: { type: 'coins', min: 100, max: 250 }, icon: '✨' },
];

const CHECKPOINT_TITLES: Record<CheckpointType, { en: string[]; vi: string[] }> = {
  landmark: {
    en: ['Ancient Monument', 'Riverside View', 'City Tower', 'Hidden Garden', 'Stone Bridge', 'Hillside Vista', 'Harbor Watch', 'Temple Gate'],
    vi: ['Cổ Thụ Trăm Năm', 'Bờ Sông Lộng Gió', 'Tháp Thành Phố', 'Vườn Bí Mật', 'Cầu Đá Rêu Phong', 'Đồi Ngắm Cảnh', 'Bến Cảng Hoàng Hôn', 'Cổng Đền Cổ'],
  },
  cache: {
    en: ['Common Cache', 'Bronze Chest', 'Silver Cache', 'Traveler\'s Box', 'Explorer\'s Stash', 'Fortune Pouch'],
    vi: ['Rương Đồng Cổ', 'Kho Bạc Lữ Khách', 'Hộp Đồ Thám Hiểm', 'Túi May Mắn', 'Hòm Tiếp Tế', 'Túi Vàng'],
  },
  fragment: {
    en: ['Rare Relic', 'Ancient Crystal', 'Map Shard', 'Mystic Gem', 'Zone Key'],
    vi: ['Cổ Vật Quý Hiếm', 'Pha Lê Cổ Đại', 'Mảnh Bản Đồ', 'Ngọc Huyền Bí', 'Chìa Khóa Vùng'],
  },
  mystery: {
    en: ['Mystery Enigma Vault', 'Unknown Ancient Cache', 'Celestial Chest', 'Sealed Mythic Vault'],
    vi: ['Rương Bí Ẩn Vô Cực', 'Kho Báu Huyền Bí', 'Hòm Thần Thoại', 'Hầm Niêm Phong Cổ'],
  },
};

// ── Seeded RNG ────────────────────────────────────────────

function hashCoord(lat: number, lon: number, salt: number): number {
  const a = Math.floor(lat * 100000) ^ salt;
  const b = Math.floor(lon * 100000) ^ (salt * 31);
  let h = (a * 2654435761) ^ b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return (h & 0x7fffffff) / 0x7fffffff;
}

// ── Daily Deterministic Chest Generator ───────────────────

export function generateDailyChests(
  userLocation: MapCoordinate,
  discoveredIds: string[],
): Checkpoint[] {
  const today = new Date().toISOString().split('T')[0];
  const dateSeed = today.split('-').reduce((acc, part) => acc * 100 + parseInt(part, 10), 0);
  const discoveredSet = new Set(discoveredIds);
  const chests: Checkpoint[] = [];

  // Spawn 5 daily mystery chests in a 300m - 1200m radius around runner
  const CHEST_COUNT = 5;
  for (let i = 0; i < CHEST_COUNT; i++) {
    const angleRand = hashCoord(userLocation.latitude, userLocation.longitude, dateSeed + i * 13 + 1);
    const distRand = hashCoord(userLocation.latitude, userLocation.longitude, dateSeed + i * 17 + 2);
    const typeRand = hashCoord(userLocation.latitude, userLocation.longitude, dateSeed + i * 23 + 3);

    const angle = angleRand * Math.PI * 2;
    // Distance between 300m and 1100m (~0.0027 to ~0.010 degrees)
    const distanceDeg = 0.0028 + distRand * 0.0072;
    const lat = userLocation.latitude + Math.cos(angle) * distanceDeg;
    const lon = userLocation.longitude + Math.sin(angle) * (distanceDeg / Math.cos((userLocation.latitude * Math.PI) / 180));

    const id = `chest-${today}-${i}`;

    let typeInfo = CHECKPOINT_TYPES[1]; // default cache
    if (typeRand < 0.20) typeInfo = CHECKPOINT_TYPES[0]; // landmark
    else if (typeRand < 0.65) typeInfo = CHECKPOINT_TYPES[1]; // cache
    else if (typeRand < 0.90) typeInfo = CHECKPOINT_TYPES[2]; // fragment
    else typeInfo = CHECKPOINT_TYPES[3]; // mystery

    const titles = CHECKPOINT_TITLES[typeInfo.type].vi;
    const title = titles[Math.floor(typeRand * titles.length) % titles.length];
    const rewardAmount = Math.round(typeInfo.reward.min + distRand * (typeInfo.reward.max - typeInfo.reward.min));

    chests.push({
      id,
      type: typeInfo.type,
      title,
      coordinate: { latitude: lat, longitude: lon },
      reward: { type: typeInfo.reward.type, amount: rewardAmount },
      discovered: discoveredSet.has(id),
      discoveredAt: null,
    });
  }

  return chests;
}

// ── Checkpoint Generation ─────────────────────────────────

export function generateNearbyCheckpoints(
  userLocation: MapCoordinate,
  discoveredIds: string[],
): Checkpoint[] {
  const dailyChests = generateDailyChests(userLocation, discoveredIds);
  const checkpoints: Checkpoint[] = [...dailyChests];
  const discoveredSet = new Set(discoveredIds);

  const centerGridLat = Math.floor(userLocation.latitude / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;
  const centerGridLon = Math.floor(userLocation.longitude / GRID_SIZE_DEGREES) * GRID_SIZE_DEGREES;
  const gridRange = Math.ceil(GENERATE_RADIUS_DEGREES / GRID_SIZE_DEGREES);

  for (let dLat = -gridRange; dLat <= gridRange; dLat++) {
    for (let dLon = -gridRange; dLon <= gridRange; dLon++) {
      const gridLat = centerGridLat + dLat * GRID_SIZE_DEGREES;
      const gridLon = centerGridLon + dLon * GRID_SIZE_DEGREES;

      for (let i = 0; i < CHECKPOINTS_PER_GRID; i++) {
        const r1 = hashCoord(gridLat, gridLon, i * 7 + 1);
        const r2 = hashCoord(gridLat, gridLon, i * 7 + 2);
        const r3 = hashCoord(gridLat, gridLon, i * 7 + 3);
        const r4 = hashCoord(gridLat, gridLon, i * 7 + 4);
        const r5 = hashCoord(gridLat, gridLon, i * 7 + 5);

        if (r1 > 0.45) continue;

        const lat = gridLat + r2 * GRID_SIZE_DEGREES;
        const lon = gridLon + r3 * GRID_SIZE_DEGREES;
        const id = `cp-${gridLat.toFixed(5)}-${gridLon.toFixed(5)}-${i}`;

        const typeRoll = r4 * 100;
        let cumWeight = 0;
        let typeInfo = CHECKPOINT_TYPES[0];
        for (const ct of CHECKPOINT_TYPES) {
          cumWeight += ct.weight;
          if (typeRoll < cumWeight) {
            typeInfo = ct;
            break;
          }
        }

        const titles = CHECKPOINT_TITLES[typeInfo.type].vi;
        const titleIndex = Math.floor(r5 * titles.length) % titles.length;
        const title = titles[titleIndex];
        const rewardAmount = Math.round(typeInfo.reward.min + r1 * (typeInfo.reward.max - typeInfo.reward.min));

        checkpoints.push({
          id,
          type: typeInfo.type,
          title,
          coordinate: { latitude: lat, longitude: lon },
          reward: { type: typeInfo.reward.type, amount: rewardAmount },
          discovered: discoveredSet.has(id),
          discoveredAt: null,
        });
      }
    }
  }

  checkpoints.sort((a, b) => {
    const dA = Math.hypot(a.coordinate.latitude - userLocation.latitude, a.coordinate.longitude - userLocation.longitude);
    const dB = Math.hypot(b.coordinate.latitude - userLocation.latitude, b.coordinate.longitude - userLocation.longitude);
    return dA - dB;
  });

  return checkpoints.slice(0, MAX_VISIBLE_CHECKPOINTS);
}

// ── Proximity & Compass Bearing ───────────────────────────

export function calculateBearing(start: MapCoordinate, dest: MapCoordinate): string {
  const y = Math.sin(((dest.longitude - start.longitude) * Math.PI) / 180) * Math.cos((dest.latitude * Math.PI) / 180);
  const x =
    Math.cos((start.latitude * Math.PI) / 180) * Math.sin((dest.latitude * Math.PI) / 180) -
    Math.sin((start.latitude * Math.PI) / 180) *
      Math.cos((dest.latitude * Math.PI) / 180) *
      Math.cos(((dest.longitude - start.longitude) * Math.PI) / 180);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  if (brng >= 337.5 || brng < 22.5) return 'Bắc (N)';
  if (brng >= 22.5 && brng < 67.5) return 'Đông Bắc (NE)';
  if (brng >= 67.5 && brng < 112.5) return 'Đông (E)';
  if (brng >= 112.5 && brng < 157.5) return 'Đông Nam (SE)';
  if (brng >= 157.5 && brng < 202.5) return 'Nam (S)';
  if (brng >= 202.5 && brng < 247.5) return 'Tây Nam (SW)';
  if (brng >= 247.5 && brng < 292.5) return 'Tây (W)';
  return 'Tây Bắc (NW)';
}

// ── Proximity Check ───────────────────────────────────────

function metersBetween(a: MapCoordinate, b: MapCoordinate): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function checkProximityDiscoveries(
  userLocation: MapCoordinate,
  checkpoints: Checkpoint[],
): Checkpoint[] {
  return checkpoints.filter(
    cp => !cp.discovered && metersBetween(userLocation, cp.coordinate) <= DISCOVERY_RADIUS_METERS,
  );
}

// ── Get nearby undiscovered info ──────────────────────────

export function getNearestUndiscovered(
  userLocation: MapCoordinate,
  checkpoints: Checkpoint[],
): { checkpoint: Checkpoint; distance: number } | null {
  const undiscovered = checkpoints.filter(cp => !cp.discovered);
  if (undiscovered.length === 0) return null;

  let nearest = undiscovered[0];
  let minDist = metersBetween(userLocation, nearest.coordinate);

  for (let i = 1; i < undiscovered.length; i++) {
    const dist = metersBetween(userLocation, undiscovered[i].coordinate);
    if (dist < minDist) {
      nearest = undiscovered[i];
      minDist = dist;
    }
  }

  return { checkpoint: nearest, distance: Math.round(minDist) };
}
