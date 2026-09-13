import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import type { MapCoordinate } from '@/models/types';

interface RouteThumbnailProps {
  route?: MapCoordinate[];
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

export function RouteThumbnail({
  route,
  width = 84,
  height = 72,
  strokeColor = '#FC5200', // Strava signature athletic orange
  strokeWidth = 2.8,
}: RouteThumbnailProps) {
  if (!route || !Array.isArray(route) || route.length < 2) {
    // Empty track placeholder when no GPS path exists
    return (
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height} viewBox="0 0 100 80">
          <Circle cx="50" cy="40" r="4" fill="#94A3B8" opacity={0.5} />
        </Svg>
      </View>
    );
  }

  // Calculate GPS coordinates bounding box
  let minLat = Infinity,
    maxLat = -Infinity;
  let minLng = Infinity,
    maxLng = -Infinity;

  for (const pt of route) {
    if (typeof pt.latitude !== 'number' || typeof pt.longitude !== 'number') continue;
    if (pt.latitude < minLat) minLat = pt.latitude;
    if (pt.latitude > maxLat) maxLat = pt.latitude;
    if (pt.longitude < minLng) minLng = pt.longitude;
    if (pt.longitude > maxLng) maxLng = pt.longitude;
  }

  if (minLat === Infinity || minLng === Infinity) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height} viewBox="0 0 100 80">
          <Circle cx="50" cy="40" r="4" fill="#94A3B8" opacity={0.5} />
        </Svg>
      </View>
    );
  }

  const paddingX = 14;
  const paddingY = 12;
  const drawWidth = 100 - paddingX * 2;
  const drawHeight = 80 - paddingY * 2;

  const latSpan = Math.max(maxLat - minLat, 0.0001);
  const lngSpan = Math.max(maxLng - minLng, 0.0001);

  // Map coordinates to SVG 100x80 viewport
  const points = route.map(pt => {
    const x = paddingX + ((pt.longitude - minLng) / lngSpan) * drawWidth;
    const y = paddingY + (1 - (pt.latitude - minLat) / latSpan) * drawHeight;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const startPt = points[0];
  const endPt = points[points.length - 1];

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox="0 0 100 80">
        <Defs>
          <LinearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FC5200" />
            <Stop offset="100%" stopColor="#FF6B00" />
          </LinearGradient>
        </Defs>

        {/* Ambient Path Glow */}
        <Path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth + 2.5}
          strokeOpacity={0.16}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crisp Strava Vector Trail */}
        <Path
          d={pathD}
          fill="none"
          stroke="url(#trailGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start Point (Green with inner white core) */}
        {startPt && (
          <>
            <Circle cx={startPt.x} cy={startPt.y} r="3.8" fill="#10B981" />
            <Circle cx={startPt.x} cy={startPt.y} r="1.5" fill="#FFFFFF" />
          </>
        )}

        {/* End Point (Red with inner white core) */}
        {endPt && (
          <>
            <Circle cx={endPt.x} cy={endPt.y} r="3.8" fill="#EF4444" />
            <Circle cx={endPt.x} cy={endPt.y} r="1.5" fill="#FFFFFF" />
          </>
        )}
      </Svg>
    </View>
  );
}

/** Mini Elevation Profile Sparkline (Strava style) */
export function ElevationSparkline({
  width = 44,
  height = 18,
  color = '#94A3B8',
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <View style={{ width, height, justifyContent: 'center' }}>
      <Svg width={width} height={height} viewBox="0 0 44 18">
        <Path
          d="M 2 15 Q 9 14, 14 9 Q 20 5, 26 7 Q 32 9, 36 3 L 42 15 Z"
          fill={color}
          fillOpacity={0.18}
        />
        <Path
          d="M 2 15 Q 9 14, 14 9 Q 20 5, 26 7 Q 32 9, 36 3 L 42 15"
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
