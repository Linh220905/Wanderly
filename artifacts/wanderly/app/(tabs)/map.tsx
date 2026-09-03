import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/i18n';
import { LiveMap } from '@/components/LiveMap';
import { calculateSessionRewards } from '@/services/GamificationService';
import { updateMissionProgress } from '@/services/MissionService';
import { SessionSummaryModal } from '@/components/modals/SessionSummaryModal';
import { LevelUpModal } from '@/components/modals/LevelUpModal';
import { useToast } from '@/components/ui/Toast';
import type { ExplorationSession } from '@/models/types';

export default function MapScreen() {
  const { state, dispatch, profile, completeSession } = useApp();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [lastSession, setLastSession] = useState<ExplorationSession | null>(null);
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [newLevel, setNewLevel] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds(v => v + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const handleStart = useCallback(() => {
    setSeconds(0);
    setActive(true);
    showToast({ type: 'info', title: t.map.activeExploration, icon: 'navigation' });
  }, [showToast, t]);

  const handlePause = useCallback(() => {
    setActive(false);
  }, []);

  const handleFinish = useCallback(() => {
    setActive(false);

    // Calculate rewards
    const sessionData: Omit<ExplorationSession, 'id'> = {
      date: new Date().toISOString().split('T')[0],
      startedAt: new Date(Date.now() - seconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      duration: seconds,
      distance: 2400,
      cellsRevealed: 12,
      route: [],
      xpEarned: 0,
      coinsEarned: 0,
      checkpointsDiscovered: [],
      activityType: 'run',
    };

    const rewards = calculateSessionRewards(sessionData, profile);
    sessionData.xpEarned = rewards.xp;
    sessionData.coinsEarned = rewards.coins;

    const session = completeSession(sessionData);
    setLastSession(session);

    // Update missions
    if (state.missions.length > 0) {
      const updated = updateMissionProgress(
        state.missions,
        { ...profile, totalSessions: profile.totalSessions + 1 },
        sessionData.distance,
        sessionData.cellsRevealed,
        sessionData.checkpointsDiscovered.length,
      );
      dispatch({ type: 'SET_MISSIONS', missions: updated });
    }

    if (rewards.didLevelUp) {
      setNewLevel(rewards.levelAfter);
      setLevelUpVisible(true);
    } else {
      setSummaryModalVisible(true);
    }

    setSeconds(0);
  }, [seconds, profile, state.missions, dispatch, completeSession]);

  const handleLevelUpClose = () => {
    setLevelUpVisible(false);
    setSummaryModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <LiveMap
        state={{
          distance: profile.totalDistance / 1000,
          explored: profile.totalExplored,
          coins: profile.coins,
        }}
        active={active}
        seconds={seconds}
        start={handleStart}
        pause={handlePause}
        finish={handleFinish}
      />

      <SessionSummaryModal
        visible={summaryModalVisible}
        session={lastSession}
        didLevelUp={newLevel !== undefined}
        newLevel={newLevel}
        onClose={() => setSummaryModalVisible(false)}
      />

      <LevelUpModal
        visible={levelUpVisible}
        level={newLevel || profile.level}
        onClose={handleLevelUpClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
