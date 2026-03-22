"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useTwitchEvent,
  useTwitchAuth,
} from "@four-leaf-studios/twitch-overlay";
import { playAlertSound } from "@/lib/alert-sounds";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import "./goal-tracker.css";

interface GoalState {
  description: string;
  currentAmount: number;
  targetAmount: number;
  type: string;
}

export function GoalTracker() {
  const [goal, setGoal] = useState<GoalState | null>(null);
  const { token } = useTwitchAuth();

  // Fetch any already-active goals on mount
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    fetch(`https://api.twitch.tv/helix/goals?broadcaster_id=${token.userId}`, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Client-Id":
          process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ??
          localStorage.getItem(STORAGE_KEYS.CLIENT_ID) ??
          "",
      },
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          json: {
            data?: {
              description: string;
              current_amount: number;
              target_amount: number;
              type: string;
            }[];
          } | null,
        ) => {
          const active = json?.data?.[0];
          if (active) {
            setGoal({
              description: active.description ?? "Goal",
              currentAmount: active.current_amount ?? 0,
              targetAmount: active.target_amount ?? 100,
              type: active.type ?? "subscription",
            });
          }
        },
      )
      .catch(() => {
        /* ignore fetch errors */
      });

    return () => controller.abort();
  }, [token]);

  useTwitchEvent(
    "channel.goal.begin",
    useCallback((event: Record<string, unknown>) => {
      playAlertSound("goal");
      setGoal({
        description: (event.description as string) ?? "Goal",
        currentAmount: (event.current_amount as number) ?? 0,
        targetAmount: (event.target_amount as number) ?? 100,
        type: (event.type as string) ?? "subscription",
      });
    }, []),
  );

  useTwitchEvent(
    "channel.goal.progress",
    useCallback((event: Record<string, unknown>) => {
      setGoal((prev) =>
        prev
          ? {
              ...prev,
              currentAmount:
                (event.current_amount as number) ?? prev.currentAmount,
              targetAmount:
                (event.target_amount as number) ?? prev.targetAmount,
            }
          : null,
      );
    }, []),
  );

  useTwitchEvent(
    "channel.goal.end",
    useCallback(() => {
      setTimeout(() => setGoal(null), 6000);
    }, []),
  );

  const pct = goal
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  return (
    <AnimatePresence>
      {goal && (
        <motion.div
          className="rl-goal-tracker"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{
            type: "spring" as const,
            stiffness: 200,
            damping: 20,
          }}
        >
          <div className="rl-goal-tracker__card">
            <div className="rl-goal-tracker__header">
              <span className="rl-goal-tracker__label">🎯 Goal</span>
              <span className="rl-goal-tracker__count">
                {goal.currentAmount} / {goal.targetAmount}
              </span>
            </div>
            <div className="rl-goal-tracker__description">
              {goal.description}
            </div>
            <div className="rl-goal-tracker__bar-track">
              <motion.div
                className="rl-goal-tracker__bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" as const }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
