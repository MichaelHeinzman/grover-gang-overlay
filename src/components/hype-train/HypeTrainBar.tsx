"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTwitchEvent } from "@four-leaf-studios/twitch-overlay";
import { playAlertSound } from "@/lib/alert-sounds";
import "./hype-train.css";

interface HypeTrainState {
  level: number;
  progress: number;
  goal: number;
  topContributors: { user: string; total: number }[];
}

export function HypeTrainBar() {
  const [train, setTrain] = useState<HypeTrainState | null>(null);

  useTwitchEvent(
    "channel.hype_train.begin",
    useCallback((event: Record<string, unknown>) => {
      playAlertSound("hype-train");
      setTrain({
        level: (event.level as number) ?? 1,
        progress: (event.progress as number) ?? 0,
        goal: (event.goal as number) ?? 100,
        topContributors: [],
      });
    }, []),
  );

  useTwitchEvent(
    "channel.hype_train.progress",
    useCallback((event: Record<string, unknown>) => {
      playAlertSound("hype-progress");
      const contributors =
        (
          event.top_contributions as { user_name: string; total: number }[]
        )?.map((c) => ({ user: c.user_name, total: c.total })) ?? [];
      setTrain({
        level: (event.level as number) ?? 1,
        progress: (event.progress as number) ?? 0,
        goal: (event.goal as number) ?? 100,
        topContributors: contributors.slice(0, 3),
      });
    }, []),
  );

  useTwitchEvent(
    "channel.hype_train.end",
    useCallback(() => {
      setTimeout(() => setTrain(null), 5000);
    }, []),
  );

  const pct = train ? Math.min((train.progress / train.goal) * 100, 100) : 0;

  return (
    <AnimatePresence>
      {train && (
        <motion.div
          className="rl-hype-train"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{
            type: "spring" as const,
            stiffness: 260,
            damping: 20,
          }}
        >
          <div className="rl-hype-train__glow" />
          <div className="rl-hype-train__card">
            <div className="rl-hype-train__scanline" />
            <div className="rl-hype-train__header">
              <span className="rl-hype-train__title">🚂 Hype Train</span>
              <span className="rl-hype-train__level">LVL {train.level}</span>
            </div>
            <div className="rl-hype-train__bar-track">
              <motion.div
                className="rl-hype-train__bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" as const }}
              />
            </div>
            {train.topContributors.length > 0 && (
              <div className="rl-hype-train__contributors">
                {train.topContributors.map((c) => (
                  <span key={c.user}>
                    {c.user}: {c.total}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
