"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useTwitchEvent,
  useTwitchData,
} from "@four-leaf-studios/twitch-overlay";
import { useWidgetTransition } from "@/hooks/useWidgetTransition";
import "./info-ticker.css";

// ── Slide types ──

interface TickerSlide {
  key: string;
  icon: string;
  label: string;
  value: string;
  color: string;
  /** Optional progress bar (0–100) */
  progress?: number;
}

interface GoalData {
  description: string;
  current: number;
  target: number;
}

interface StreamStats {
  lastFollower: string | null;
  lastSubscriber: string | null;
  lastSubTier: string | null;
  lastGifter: string | null;
  lastGiftCount: number;
  topCheerer: string | null;
  topCheererBits: number;
  lastRedeemer: string | null;
  lastRedeemTitle: string | null;
  lastRaider: string | null;
  lastRaidViewers: number;
}

const TIER_NAMES: Record<string, string> = {
  "1000": "Tier 1",
  "2000": "Tier 2",
  "3000": "Tier 3",
};

const CYCLE_MS = 6000;

export function InfoTicker() {
  const helixData = useTwitchData();
  const [goal, setGoal] = useState<GoalData | null>(null);
  const [stats, setStats] = useState<StreamStats>({
    lastFollower: null,
    lastSubscriber: null,
    lastSubTier: null,
    lastGifter: null,
    lastGiftCount: 0,
    topCheerer: null,
    topCheererBits: 0,
    lastRedeemer: null,
    lastRedeemTitle: null,
    lastRaider: null,
    lastRaidViewers: 0,
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const cheererMap = useRef<Map<string, number>>(new Map());
  const seededRef = useRef(false);

  // ── Seed state from library Helix data once loaded ──

  useEffect(() => {
    if (!helixData.loaded || seededRef.current) return;
    seededRef.current = true;

    // Use microtask to avoid the "sync setState in effect" lint rule
    queueMicrotask(() => {
      const activeGoal = helixData.goals[0];
      if (activeGoal) {
        setGoal(
          (prev) =>
            prev ?? {
              description: activeGoal.description ?? "Goal",
              current: activeGoal.currentAmount ?? 0,
              target: activeGoal.targetAmount ?? 100,
            },
        );
      }

      const updates: Partial<StreamStats> = {};
      if (helixData.latestFollower) {
        updates.lastFollower = helixData.latestFollower.userName;
      }
      if (helixData.latestSubscriber) {
        updates.lastSubscriber = helixData.latestSubscriber.userName;
        updates.lastSubTier =
          TIER_NAMES[helixData.latestSubscriber.tier] ?? "Tier 1";
      }
      if (helixData.topCheerer) {
        updates.topCheerer = helixData.topCheerer.userName;
        updates.topCheererBits = helixData.topCheerer.score;
        cheererMap.current.set(
          helixData.topCheerer.userName,
          helixData.topCheerer.score,
        );
      }
      if (Object.keys(updates).length) {
        setStats((prev) => ({ ...prev, ...updates }));
      }
    });
  }, [helixData]);

  // ── EventSub listeners for stats ──

  useTwitchEvent(
    "channel.follow",
    useCallback((e: Record<string, unknown>) => {
      setStats((s) => ({
        ...s,
        lastFollower: (e.user_name as string) ?? null,
      }));
    }, []),
  );

  useTwitchEvent(
    "channel.subscribe",
    useCallback((e: Record<string, unknown>) => {
      setStats((s) => ({
        ...s,
        lastSubscriber: (e.user_name as string) ?? null,
        lastSubTier: TIER_NAMES[(e.tier as string) ?? "1000"] ?? "Tier 1",
      }));
    }, []),
  );

  useTwitchEvent(
    "channel.subscription.message",
    useCallback((e: Record<string, unknown>) => {
      setStats((s) => ({
        ...s,
        lastSubscriber: (e.user_name as string) ?? null,
        lastSubTier: TIER_NAMES[(e.tier as string) ?? "1000"] ?? "Tier 1",
      }));
    }, []),
  );

  useTwitchEvent(
    "channel.subscription.gift",
    useCallback((e: Record<string, unknown>) => {
      setStats((s) => ({
        ...s,
        lastGifter: (e.user_name as string) ?? null,
        lastGiftCount: (e.total as number) ?? 1,
      }));
    }, []),
  );

  useTwitchEvent(
    "channel.cheer",
    useCallback((e: Record<string, unknown>) => {
      const user = (e.user_name as string) ?? "Anonymous";
      const bits = (e.bits as number) ?? 0;
      cheererMap.current.set(user, (cheererMap.current.get(user) ?? 0) + bits);
      // Find current top
      let topUser = user;
      let topBits = 0;
      cheererMap.current.forEach((total, name) => {
        if (total > topBits) {
          topBits = total;
          topUser = name;
        }
      });
      setStats((s) => ({
        ...s,
        topCheerer: topUser,
        topCheererBits: topBits,
      }));
    }, []),
  );

  useTwitchEvent(
    "channel.raid",
    useCallback((e: Record<string, unknown>) => {
      setStats((s) => ({
        ...s,
        lastRaider: (e.from_broadcaster_user_name as string) ?? null,
        lastRaidViewers: (e.viewers as number) ?? 0,
      }));
    }, []),
  );

  useTwitchEvent(
    "channel.channel_points_custom_reward_redemption.add",
    useCallback((e: Record<string, unknown>) => {
      const reward = e.reward as { title: string } | undefined;
      setStats((s) => ({
        ...s,
        lastRedeemer: (e.user_name as string) ?? null,
        lastRedeemTitle: reward?.title ?? null,
      }));
    }, []),
  );

  // ── Goal events ──

  useTwitchEvent(
    "channel.goal.begin",
    useCallback((e: Record<string, unknown>) => {
      setGoal({
        description: (e.description as string) ?? "Goal",
        current: (e.current_amount as number) ?? 0,
        target: (e.target_amount as number) ?? 100,
      });
    }, []),
  );

  useTwitchEvent(
    "channel.goal.progress",
    useCallback((e: Record<string, unknown>) => {
      setGoal((prev) =>
        prev
          ? {
              ...prev,
              current: (e.current_amount as number) ?? prev.current,
              target: (e.target_amount as number) ?? prev.target,
            }
          : null,
      );
    }, []),
  );

  useTwitchEvent(
    "channel.goal.end",
    useCallback(() => {
      setTimeout(() => setGoal(null), 8000);
    }, []),
  );

  // ── Build slides ──

  const slides: TickerSlide[] = [];

  if (goal) {
    const pct = Math.min((goal.current / goal.target) * 100, 100);
    slides.push({
      key: "goal",
      icon: "🎯",
      label: "Goal",
      value: `${goal.description} — ${goal.current}/${goal.target}`,
      color: "#00FF88",
      progress: pct,
    });
  }

  slides.push({
    key: "follower",
    icon: "🏎️",
    label: "Latest Follower",
    value: stats.lastFollower ?? "Waiting for followers...",
    color: "#00AAFF",
  });

  slides.push({
    key: "sub",
    icon: "🏆",
    label: "Latest Sub",
    value: stats.lastSubscriber
      ? `${stats.lastSubscriber} (${stats.lastSubTier})`
      : "Waiting for subs...",
    color: "#FF8C00",
  });

  slides.push({
    key: "cheerer",
    icon: "⚡",
    label: "Top Cheerer",
    value: stats.topCheerer
      ? `${stats.topCheerer} — ${stats.topCheererBits.toLocaleString()} bits`
      : "Waiting for cheers...",
    color: "#FFD700",
  });

  if (stats.lastGifter) {
    slides.push({
      key: "gifter",
      icon: "🎁",
      label: "Latest Gifter",
      value: `${stats.lastGifter} — ${stats.lastGiftCount} sub${stats.lastGiftCount > 1 ? "s" : ""}`,
      color: "#00E5FF",
    });
  }

  if (stats.lastRaider) {
    slides.push({
      key: "raider",
      icon: "💥",
      label: "Latest Raid",
      value: `${stats.lastRaider} — ${stats.lastRaidViewers} viewers`,
      color: "#FF4500",
    });
  }

  if (stats.lastRedeemer) {
    slides.push({
      key: "redeem",
      icon: "🎯",
      label: "Latest Redeem",
      value: `${stats.lastRedeemer} — ${stats.lastRedeemTitle}`,
      color: "#00FF88",
    });
  }

  // ── Cycle through slides ──

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % slides.length);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Clamp index if slides shrink
  const idx = slides.length > 0 ? activeIdx % slides.length : 0;
  const current = slides[idx];

  const tickerTransition = useWidgetTransition("left");

  if (!current) return null;

  return (
    <motion.div className="rl-info-ticker" {...tickerTransition}>
      <div
        className="rl-info-ticker__card"
        style={{ "--_ticker-color": current.color } as React.CSSProperties}
      >
        <div className="rl-info-ticker__accent-top" />
        <div className="rl-info-ticker__accent-bottom" />
        <div className="rl-info-ticker__scanline" />
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            className="rl-info-ticker__slide"
            initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <span className="rl-info-ticker__icon">{current.icon}</span>
            <div className="rl-info-ticker__body">
              <div className="rl-info-ticker__label">{current.label}</div>
              <div className="rl-info-ticker__value">{current.value}</div>
              {current.progress !== undefined && (
                <div className="rl-info-ticker__bar-track">
                  <motion.div
                    className="rl-info-ticker__bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${current.progress}%` }}
                    transition={{
                      duration: 0.6,
                      ease: "easeOut" as const,
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
