/**
 * Checkpoint (POI) system for Wanderly.
 *
 * Generates checkpoints procedurally near the user's location.
 * Uses grid-based seeding so checkpoints stay consistent across sessions.
 */

import { type Checkpoint, type CheckpointType, type MapCoordinate } from '@/models/types';

// ── Constants ─────────────────────────────────────────────

const GRID_SIZE_DEGREES = 0.003; // ~330m grid cells
const CHECKPOINTS_PER_GRID = 2;
const DISCOVERY_RADIUS_METERS = 50;
const MAX_VISIBLE_CHECKPOINTS = 15;
const GENERATE_RADIUS_DEGREES = 0.02; // ~2.2km around user

// ── Types & Rewards ───────────────────────────────────────

const CHECKPOINT_TYPES: { type: CheckpointType; weight: number; reward: { type: 'xp' | 'coins'; min: number; max: number } }[] = [
  { type: 'landmark', weight: 35, reward: { type: 'xp', min: 30, max: 80 } },
  { type: 'cache', weight: 30, reward: { type: 'coins', min: 20, max: 60 } },
  { type: 'fragment', weight: 25, reward: { type: 'xp', min: 40, max: 100 } },
  { type: 'mystery', weight: 10, reward: { type: 'coins', min: 50, max: 150 } },
];

const CHECKPOINT_TITLES: Record<CheckpointType, { en: string[]; vi: string[] }> = {
  landmark: {
    en: ['Ancient Oak', 'Riverside View', 'City Tower', 'Hidden Garden', 'Stone Bridge', 'Hillside Vista', 'Harbor Watch', 'Temple Gate'],
    vi: ['Cổ Thụ', 'Bờ Sông', 'Tháp Thành Phố', 'Vườn Bí Mật', 'Cầu Đá', 'Đồi Ngắm Cảnh', 'Bến Cảng', 'Cổng Đền'],
  },
  cache: {
    en: ['Bronze Chest', 'Silver Cache', 'Merchant\'s Stash', 'Traveler\'s Box', 'Fortune Pouch', 'Gem Satchel'],
    vi: ['Rương Đồng', 'Kho Bạc', 'Túi Thương Nhân', 'Hộp Lữ Khách', 'Túi May Mắn', 'Bao Ngọc'],
  },
  fragment: {
    en: ['City Fragment', 'District Piece', 'Map Shard', 'Area Token', 'Zone Key'],
    vi: ['Mảnh Thành Phố', 'Miếng Quận', 'Mảnh Bản Đồ', 'Thẻ Khu Vực', 'Chìa Khóa Vùng'],
  },
  mystery: {
    en: ['Mystery Chest', 'Unknown Cache', 'Sealed Box', 'Enigma Vault'],
    vi: ['Rương Bí Ẩn', 'Kho Ẩn', 'Hộp Niêm Phong', 'Hầm Bí Ẩn'],
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

// ── Checkpoint Generation ─────────────────────────────────

export function generateNearbyCheckpoints(
  userLocation: MapCoordinate,
  discoveredIds: string[],
): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];
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

        // Only ~60% of grid cells have a checkpoint
        if (r1 > 0.6) continue;

        const lat = gridLat + r2 * GRID_SIZE_DEGREES;
        const lon = gridLon + r3 * GRID_SIZE_DEGREES;
        const id = `cp-${gridLat.toFixed(5)}-${gridLon.toFixed(5)}-${i}`;

        // Pick type based on weighted random
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

        // Pick title
        const titles = CHECKPOINT_TITLES[typeInfo.type].en;
        const titleIndex = Math.floor(r5 * titles.length);
        const title = titles[titleIndex];

        // Calculate reward
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

  // Sort by distance to user and limit
  checkpoints.sort((a, b) => {
    const dA = Math.hypot(a.coordinate.latitude - userLocation.latitude, a.coordinate.longitude - userLocation.longitude);
    const dB = Math.hypot(b.coordinate.latitude - userLocation.latitude, b.coordinate.longitude - userLocation.longitude);
    return dA - dB;
  });

  return checkpoints.slice(0, MAX_VISIBLE_CHECKPOINTS);
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
