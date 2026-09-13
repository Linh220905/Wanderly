export const MAP_HTML_SOURCE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; position: relative; background: #F1F5F9; overflow: hidden; }
    .maplibregl-ctrl, .maplibregl-ctrl-attrib { display: none !important; }

    .maplibregl-canvas-container {
      width: 100% !important;
      height: 100% !important;
      position: relative;
    }

    /* Hardware Accelerated Fog Canvas Overlay inside map canvas container */
    #fog-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2;
    }

    /* MapLibre DOM Overlays & Markers container above fog */
    .maplibregl-marker {
      z-index: 10 !important;
      pointer-events: auto !important;
    }

    /* User Blue/Orange Dot Marker */
    .user-marker {
      width: 36px;
      height: 36px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20 !important;
    }
    .user-pulse {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(249, 115, 22, 0.25);
      border: 2px solid #F97316;
      animation: pulse 1.6s infinite ease-out;
    }
    .user-dot {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #F97316;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.6);
    }
    @keyframes pulse {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.8); opacity: 0; }
    }

    /* Game Checkpoints Custom Badges */
    .checkpoint-marker-wrapper {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      pointer-events: auto !important;
    }
    .checkpoint-marker-inner {
      width: 42px;
      height: 42px;
      border-radius: 21px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 18px rgba(15, 23, 42, 0.35);
      border: 2.5px solid #FFFFFF;
      animation: checkpoint-bounce 2.2s infinite ease-in-out;
      transition: transform 0.15s ease;
    }
    .checkpoint-marker-inner:active {
      transform: scale(0.88);
    }
    .checkpoint-badge-cache {
      background: linear-gradient(135deg, #F97316, #EA580C);
    }
    .checkpoint-badge-landmark {
      background: linear-gradient(135deg, #0EA5E9, #0284C7);
    }
    .checkpoint-badge-fragment {
      background: linear-gradient(135deg, #10B981, #059669);
    }
    .checkpoint-badge-mystery {
      background: linear-gradient(135deg, #F59E0B, #D97706);
    }

    /* Mystery Hike Beacon Marker */
    .mystery-beacon-wrapper {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      pointer-events: auto !important;
      position: relative;
    }
    .mystery-beacon-pulse {
      position: absolute;
      width: 54px;
      height: 54px;
      border-radius: 27px;
      background: rgba(147, 51, 234, 0.35);
      border: 2px solid #A855F7;
      animation: beacon-pulse 1.8s infinite ease-out;
    }
    .mystery-beacon-inner {
      width: 46px;
      height: 46px;
      border-radius: 23px;
      background: linear-gradient(135deg, #9333EA, #6366F1);
      border: 2.5px solid #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(147, 51, 234, 0.65);
      animation: checkpoint-bounce 2s infinite ease-in-out;
    }
    @keyframes beacon-pulse {
      0% { transform: scale(0.7); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes checkpoint-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <canvas id="fog-canvas"></canvas>

  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <script>
    let START_LAT = 16.0544;
    let START_LNG = 108.2022;
    const START_REVEAL_RADIUS_METERS = 38;
    const EXPLORATION_ZONE_RADIUS_METERS = 800; // Single unified boundary around user
    const CORRIDOR_RADIUS_METERS = 24; // 48m wide clearing corridor (easily covers houses between 2 roads)

    let map;
    let canvas, ctx;
    let userMarker;
    let followUser = true;
    let currentUserLat = START_LAT;
    let currentUserLng = START_LNG;
    let explorationCenterLat = START_LAT;
    let explorationCenterLng = START_LNG;
    let currentCheckpoints = [];
    let checkpointMarkers = [];
    let mysteryQuest = null;
    let mysteryMarker = null;
    const dpr = window.devicePixelRatio || 2;

    // Store revealed points [lat, lng]
    let revealedPoints = [];
    let isSimulating = false;
    let simWaypoints = [];
    let simSegmentDistances = [];
    let simTotalDistance = 0;
    let simDistanceTraveled = 0;
    let lastAnimTime = 0;
    let simAnimId = null;
    let isFetchingNextSegment = false;
    const SIM_SPEED_MPS = 10.8; // 10.8 m/s ~ 39 km/h (x3 fast simulation speed)

    function initMap() {
      // 100% Open-Source Vector Map (OpenFreeMap Positron - 0% API Key, Ultra Sharp WebGL Vector)
      map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [currentUserLng, currentUserLat],
        zoom: 16.5,
        pitchWithRotate: false,
        dragRotate: false,
        attributionControl: false
      });

      canvas = document.getElementById('fog-canvas');
      ctx = canvas.getContext('2d');
      resizeCanvas();

      window.addEventListener('resize', resizeCanvas);

      map.on('load', () => {
        // Strip 100% of labels, street names, POIs, house numbers at WebGL shader level
        const style = map.getStyle();
        if (style && style.layers) {
          style.layers.forEach(layer => {
            if (layer.type === 'symbol') {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          });
        }

        const el = document.createElement('div');
        el.className = 'user-marker';
        el.innerHTML = '<div class="user-pulse"></div><div class="user-dot"></div>';
        userMarker = new maplibregl.Marker({ element: el })
          .setLngLat([currentUserLng, currentUserLat])
          .addTo(map);

        revealedPoints = [[currentUserLat, currentUserLng]];
        renderFog();
        renderCheckpoints();

        sendToRN({ type: 'MAP_READY' });
      });

      map.on('render', renderFog);
      map.on('dragstart', () => {
        followUser = false;
        sendToRN({ type: 'FOLLOW_CHANGED', follow: false });
      });
      map.on('zoomstart', () => {
        // Allow free manual zoom while preserving user following
      });
    }

    // Vector SVG Icons for Game Markers
    const SVG_ICONS = {
      // Gift Box / Cache
      cache: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>',
      // Ancient Landmark / Monument
      landmark: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="22" x2="22" y2="22"></line><line x1="4" y1="18" x2="20" y2="18"></line><path d="M6 18V9"></path><path d="M10 18V9"></path><path d="M14 18V9"></path><path d="M18 18V9"></path><polygon points="12 2 2 7 22 7 12 2"></polygon></svg>',
      // Crystal / Energy Relic Fragment
      fragment: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"></path><path d="M11 3v18"></path><path d="M2 9h20"></path></svg>',
      // Mythic Star / Chest
      mystery: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
      // Compass / Mystery Hike Beacon
      beacon: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>'
    };

    function renderCheckpoints() {
      checkpointMarkers.forEach(m => m.marker.remove());
      checkpointMarkers = [];
      if (!map) return;

      currentCheckpoints.forEach(cp => {
        if (cp.discovered) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'checkpoint-marker-wrapper';
        const typeClass = 'checkpoint-badge-' + (cp.type || 'cache');
        const svgContent = SVG_ICONS[cp.type] || SVG_ICONS.cache;
        wrapper.innerHTML = '<div class="checkpoint-marker-inner ' + typeClass + '">' + svgContent + '</div>';

        wrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          sendToRN({
            type: 'CHECKPOINT_CLICK',
            checkpoint: cp
          });
        });

        const marker = new maplibregl.Marker({ element: wrapper })
          .setLngLat([cp.coordinate.longitude, cp.coordinate.latitude])
          .addTo(map);
        checkpointMarkers.push({ id: cp.id, marker });
      });
    }

    function renderMysteryHikeBeacon() {
      if (mysteryMarker) {
        mysteryMarker.remove();
        mysteryMarker = null;
      }
      if (!map || !mysteryQuest || mysteryQuest.isCompleted) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'mystery-beacon-wrapper';
      wrapper.innerHTML = '<div class="mystery-beacon-pulse"></div><div class="mystery-beacon-inner">' + SVG_ICONS.beacon + '</div>';

      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        sendToRN({
          type: 'MYSTERY_HIKE_CLICK',
          quest: mysteryQuest
        });
      });

      mysteryMarker = new maplibregl.Marker({ element: wrapper })
        .setLngLat([mysteryQuest.targetCoordinate.longitude, mysteryQuest.targetCoordinate.latitude])
        .addTo(map);
    }

    function setCheckpoints(checkpointsList) {
      currentCheckpoints = checkpointsList || [];
      renderCheckpoints();
    }

    function setTerritories(territoryList) {
      currentTerritories = territoryList || [];
      renderFog();
    }

    function setMysteryQuest(quest) {
      mysteryQuest = quest;
      renderMysteryHikeBeacon();
      renderFog();
    }

    function removeCheckpoint(id) {
      const idx = checkpointMarkers.findIndex(m => m.id === id);
      if (idx !== -1) {
        checkpointMarkers[idx].marker.remove();
        checkpointMarkers.splice(idx, 1);
      }
      const cIdx = currentCheckpoints.findIndex(c => c.id === id);
      if (cIdx !== -1) {
        currentCheckpoints.splice(cIdx, 1);
      }
    }

    function resizeCanvas() {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      renderFog();
    }

    function metersToPixels(meters, latitude) {
      if (!map) return 20;
      const zoom = map.getZoom();
      const metersPerPixel = (40075016.686 * Math.cos(latitude * Math.PI / 180)) / (512 * Math.pow(2, zoom));
      return Math.max(8, meters / metersPerPixel);
    }

    // High-performance Canvas Destination-Out Compositing (Light Fog Palette)
    function renderFog() {
      if (!ctx || !map) return;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Light Adventure Fog Overlay (Soft Slate Mist)
      ctx.fillStyle = 'rgba(203, 213, 225, 0.88)';
      ctx.fillRect(0, 0, w, h);

      // Project current user coordinates into canvas viewport space
      const centerPixel = map.project([currentUserLng, currentUserLat]);

      // Render Single Unified Exploration Perimeter pinned fixed on Base Territory Map
      const boundaryCenterPixel = map.project([explorationCenterLng, explorationCenterLat]);
      const zoneRadiusPx = metersToPixels(EXPLORATION_ZONE_RADIUS_METERS, explorationCenterLat);

      ctx.save();
      ctx.beginPath();
      ctx.arc(boundaryCenterPixel.x, boundaryCenterPixel.y, zoneRadiusPx, 0, Math.PI * 2);
      ctx.strokeStyle = '#0284C777'; // Cyan boundary
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();

      // Soft glow fill inside boundary
      ctx.fillStyle = '#0284C708';
      ctx.fill();
      ctx.restore();

      // Punch transparent holes onto the vector map
      ctx.globalCompositeOperation = 'destination-out';

      // Current User Location Circle
      const startRadiusPx = metersToPixels(START_REVEAL_RADIUS_METERS, currentUserLat);

      ctx.beginPath();
      ctx.arc(centerPixel.x, centerPixel.y, startRadiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Clear road corridor along walked route
      if (revealedPoints.length >= 2) {
        const corridorRadiusPx = metersToPixels(CORRIDOR_RADIUS_METERS, currentUserLat);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = corridorRadiusPx * 2;
        ctx.strokeStyle = '#000000';

        ctx.beginPath();
        for (let i = 0; i < revealedPoints.length; i++) {
          const pt = map.project([revealedPoints[i][1], revealedPoints[i][0]]);
          if (i === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            const prev = revealedPoints[i - 1];
            const dist = distanceBetweenMeters(prev[0], prev[1], revealedPoints[i][0], revealedPoints[i][1]);
            // Prevent drawing streaks across map when coordinates teleport or jump
            if (dist > 45.0) {
              ctx.moveTo(pt.x, pt.y);
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();

        for (let i = 0; i < revealedPoints.length; i++) {
          const pt = map.project([revealedPoints[i][1], revealedPoints[i][0]]);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, corridorRadiusPx, 0, Math.PI * 2);
          ctx.fill();
        }

        // Closed-Loop Polygon Infill Detection (Autoclear fog trapped inside closed loops/blocks)
        if (revealedPoints.length >= 8) {
          const loopIndices = [];
          for (let i = 0; i < revealedPoints.length - 6; i++) {
            for (let j = i + 6; j < revealedPoints.length; j++) {
              const d = distanceBetweenMeters(
                revealedPoints[i][0],
                revealedPoints[i][1],
                revealedPoints[j][0],
                revealedPoints[j][1]
              );
              // If start & end of a sub-path meet within 25m, it is a closed loop block
              if (d <= 25.0) {
                loopIndices.push([i, j]);
                break;
              }
            }
          }

          loopIndices.forEach(([startIdx, endIdx]) => {
            ctx.beginPath();
            for (let k = startIdx; k <= endIdx; k++) {
              const p = map.project([revealedPoints[k][1], revealedPoints[k][0]]);
              if (k === startIdx) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            ctx.fillStyle = '#000000';
            ctx.fill();
          });
        }
      }

      ctx.restore();

      // Draw Mystery Hike Radar Guidance Line (from runner to target beacon)
      if (mysteryQuest && !mysteryQuest.isCompleted) {
        const targetPx = map.project([mysteryQuest.targetCoordinate.longitude, mysteryQuest.targetCoordinate.latitude]);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerPixel.x, centerPixel.y);
        ctx.lineTo(targetPx.x, targetPx.y);
        ctx.strokeStyle = '#9333EAAA';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();

        // Pulsing circle around target
        ctx.beginPath();
        ctx.arc(targetPx.x, targetPx.y, metersToPixels(mysteryQuest.targetRadiusMeters || 30, mysteryQuest.targetCoordinate.latitude), 0, Math.PI * 2);
        ctx.strokeStyle = '#9333EA88';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#9333EA15';
        ctx.fill();
        ctx.restore();
      }
    }

    function calculateZoneExplorationPercent() {
      if (!revealedPoints || revealedPoints.length <= 1) return 0;
      let pointsInsideZone = 0;
      for (let i = 0; i < revealedPoints.length; i++) {
        const pt = revealedPoints[i];
        const distFromCenter = distanceBetweenMeters(explorationCenterLat, explorationCenterLng, pt[0], pt[1]);
        if (distFromCenter <= EXPLORATION_ZONE_RADIUS_METERS) {
          pointsInsideZone++;
        }
      }
      if (pointsInsideZone <= 1) return 0;
      // 800m circular area with ~24m corridor coverage equates to ~280 unique waypoints for full density
      const targetDensityPoints = 280;
      const pct = Math.min(100, Math.round((pointsInsideZone / targetDensityPoints) * 100));
      return pct;
    }

    function distanceBetweenMeters(lat1, lon1, lat2, lon2) {
      const R = 6371000;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    function interpolatePoints(coords, stepMeters = 2.0) {
      const res = [];
      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i+1];
        const dist = distanceBetweenMeters(p1[0], p1[1], p2[0], p2[1]);
        res.push(p1);
        if (dist > stepMeters) {
          const steps = Math.ceil(dist / stepMeters);
          for (let k = 1; k < steps; k++) {
            const ratio = k / steps;
            res.push([
              p1[0] + (p2[0] - p1[0]) * ratio,
              p1[1] + (p2[1] - p1[1]) * ratio
            ]);
          }
        }
      }
      res.push(coords[coords.length - 1]);
      return res;
    }

    async function fetchOSRMRoute(startLat, startLng, endLat, endLng) {
      try {
        const url = 'https://router.project-osrm.org/route/v1/walking/' + startLng + ',' + startLat + ';' + endLng + ',' + endLat + '?overview=full&geometries=geojson';
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes[0]?.geometry?.coordinates) {
          const pts = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          return interpolatePoints(pts, 2.0);
        }
      } catch (e) {}
      return interpolatePoints([[startLat, startLng], [endLat, endLng]], 2.0);
    }

    function getRandomNearby(lat, lng) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.0035 + Math.random() * 0.0035;
      return [lat + Math.cos(angle) * dist, lng + Math.sin(angle) * dist];
    }

    function prepareSimWaypoints(points) {
      simWaypoints = points;
      simSegmentDistances = [];
      simTotalDistance = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const d = distanceBetweenMeters(points[i][0], points[i][1], points[i+1][0], points[i+1][1]);
        simSegmentDistances.push(d);
        simTotalDistance += d;
      }
      simDistanceTraveled = 0;
    }

    function getPositionAtDistance(dist) {
      if (!simWaypoints || simWaypoints.length === 0) return [currentUserLat, currentUserLng];
      if (dist <= 0) return simWaypoints[0];
      if (dist >= simTotalDistance) return simWaypoints[simWaypoints.length - 1];

      let accum = 0;
      for (let i = 0; i < simSegmentDistances.length; i++) {
        const segDist = simSegmentDistances[i];
        if (accum + segDist >= dist) {
          const ratio = segDist > 0 ? (dist - accum) / segDist : 0;
          const p1 = simWaypoints[i];
          const p2 = simWaypoints[i+1];
          return [
            p1[0] + (p2[0] - p1[0]) * ratio,
            p1[1] + (p2[1] - p1[1]) * ratio
          ];
        }
        accum += segDist;
      }
      return simWaypoints[simWaypoints.length - 1];
    }

    function runSimulationStep(timestamp) {
      if (!isSimulating) return;

      if (!lastAnimTime) lastAnimTime = timestamp;
      const dt = Math.min((timestamp - lastAnimTime) / 1000, 0.05);
      lastAnimTime = timestamp;

      simDistanceTraveled += SIM_SPEED_MPS * dt;

      const pt = getPositionAtDistance(simDistanceTraveled);
      currentUserLat = pt[0];
      currentUserLng = pt[1];

      if (userMarker) {
        userMarker.setLngLat([currentUserLng, currentUserLat]);
      }

      const lastPt = revealedPoints[revealedPoints.length - 1];
      if (!lastPt || distanceBetweenMeters(lastPt[0], lastPt[1], currentUserLat, currentUserLng) >= 2.0) {
        revealedPoints.push([currentUserLat, currentUserLng]);
      }

      if (followUser && map) {
        map.jumpTo({ center: [currentUserLng, currentUserLat] });
      }

      renderFog();

      sendToRN({
        type: 'GPS_UPDATE',
        lat: currentUserLat,
        lng: currentUserLng,
        speed: SIM_SPEED_MPS,
        simStepDistance: SIM_SPEED_MPS * dt,
        zonePercent: calculateZoneExplorationPercent()
      });

      if (simDistanceTraveled >= simTotalDistance - 35 && !isFetchingNextSegment) {
        isFetchingNextSegment = true;
        const lastTarget = simWaypoints[simWaypoints.length - 1] || [currentUserLat, currentUserLng];
        const nextTarget = getRandomNearby(lastTarget[0], lastTarget[1]);
        fetchOSRMRoute(lastTarget[0], lastTarget[1], nextTarget[0], nextTarget[1]).then(newPts => {
          if (newPts && newPts.length > 0) {
            let currentIdx = 0;
            let acc = 0;
            for (let i = 0; i < simSegmentDistances.length; i++) {
              acc += simSegmentDistances[i];
              if (acc >= simDistanceTraveled) {
                currentIdx = i;
                break;
              }
            }
            const remaining = simWaypoints.slice(currentIdx);
            prepareSimWaypoints(remaining.concat(newPts));
          }
          isFetchingNextSegment = false;
        });
      }

      simAnimId = requestAnimationFrame(runSimulationStep);
    }

    async function startSimulation() {
      if (isSimulating) return;
      isSimulating = true;
      followUser = true;
      lastAnimTime = 0;

      const target = getRandomNearby(currentUserLat, currentUserLng);
      const pts = await fetchOSRMRoute(currentUserLat, currentUserLng, target[0], target[1]);
      prepareSimWaypoints(pts);
      isFetchingNextSegment = false;
      simAnimId = requestAnimationFrame(runSimulationStep);
    }

    function stopSimulation() {
      isSimulating = false;
      lastAnimTime = 0;
      if (simAnimId) {
        cancelAnimationFrame(simAnimId);
        simAnimId = null;
      }
    }

    function setLocation(lat, lng) {
      const isFirstSet = (explorationCenterLat === START_LAT && explorationCenterLng === START_LNG && revealedPoints.length === 0);
      if (isFirstSet) {
        explorationCenterLat = lat;
        explorationCenterLng = lng;
      }
      currentUserLat = lat;
      currentUserLng = lng;
      if (userMarker) {
        userMarker.setLngLat([lng, lat]);
      }
      if (followUser && map) {
        map.jumpTo({ center: [lng, lat] });
      }

      // Reset revealed points if coordinates jumped (e.g. fresh GPS fix after mount)
      if (revealedPoints.length > 0) {
        const first = revealedPoints[0];
        const jumpDist = distanceBetweenMeters(first[0], first[1], lat, lng);
        if (jumpDist > 100.0) {
          revealedPoints = [[lat, lng]];
          explorationCenterLat = lat;
          explorationCenterLng = lng;
        }
      }

      const lastPt = revealedPoints[revealedPoints.length - 1];
      if (!lastPt || distanceBetweenMeters(lastPt[0], lastPt[1], lat, lng) >= 3.0) {
        revealedPoints.push([lat, lng]);
      }
      renderFog();
      renderCheckpoints();
      renderMysteryHikeBeacon();
    }

    function recenter() {
      followUser = true;
      if (map) {
        map.flyTo({ center: [currentUserLng, currentUserLat], zoom: 16.5 });
      }
      renderFog();
    }

    function zoomIn() {
      if (map) map.zoomIn();
    }

    function zoomOut() {
      if (map) map.zoomOut();
    }

    function sendToRN(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
    }

    function handleRNMessage(msg) {
      try {
        if (!msg) return;
        if (msg.type === 'START_SIMULATION') {
          startSimulation();
        } else if (msg.type === 'STOP_SIMULATION') {
          stopSimulation();
        } else if (msg.type === 'SET_LOCATION') {
          setLocation(msg.lat, msg.lng);
        } else if (msg.type === 'RECENTER') {
          recenter();
        } else if (msg.type === 'ZOOM_IN') {
          zoomIn();
        } else if (msg.type === 'ZOOM_OUT') {
          zoomOut();
        } else if (msg.type === 'LOAD_HISTORICAL_ROUTE') {
          if (Array.isArray(msg.points) && msg.points.length > 0) {
            revealedPoints = msg.points.map(p => [p.latitude || p[0], p.longitude || p[1]]);
            renderFog();
          }
        } else if (msg.type === 'SET_CHECKPOINTS') {
          setCheckpoints(msg.checkpoints || []);
        } else if (msg.type === 'REMOVE_CHECKPOINT') {
          removeCheckpoint(msg.id);
        } else if (msg.type === 'SET_TERRITORIES') {
          setTerritories(msg.territories || []);
        } else if (msg.type === 'SET_MYSTERY_QUEST') {
          setMysteryQuest(msg.quest || null);
        }
      } catch (e) {}
    }

    window.handleRNMessage = handleRNMessage;

    window.addEventListener('message', (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        handleRNMessage(msg);
      } catch (e) {}
    });

    document.addEventListener('DOMContentLoaded', initMap);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initMap();
    }
  </script>
</body>
</html>
`;
