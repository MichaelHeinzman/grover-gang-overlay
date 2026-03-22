"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTwitchEvent } from "@four-leaf-studios/twitch-overlay";
import { playAlertSound } from "@/lib/alert-sounds";
import "./prediction-overlay.css";

interface PredictionOutcome {
  id: string;
  title: string;
  channelPoints: number;
  users: number;
  color: string;
}

interface PredictionState {
  title: string;
  outcomes: PredictionOutcome[];
  status: "active" | "locked" | "ended";
  winningId?: string;
}

function parseOutcomes(raw: Record<string, unknown>[]): PredictionOutcome[] {
  return raw.map((o) => ({
    id: (o.id as string) ?? "",
    title: (o.title as string) ?? "",
    channelPoints: (o.channel_points as number) ?? 0,
    users: (o.users as number) ?? 0,
    color: (o.color as string) ?? "BLUE",
  }));
}

export function PredictionOverlay() {
  const [prediction, setPrediction] = useState<PredictionState | null>(null);

  useTwitchEvent(
    "channel.prediction.begin",
    useCallback((event: Record<string, unknown>) => {
      playAlertSound("prediction");
      const outcomes = parseOutcomes(
        (event.outcomes as Record<string, unknown>[]) ?? [],
      );
      setPrediction({
        title: (event.title as string) ?? "Prediction",
        outcomes,
        status: "active",
      });
    }, []),
  );

  useTwitchEvent(
    "channel.prediction.progress",
    useCallback((event: Record<string, unknown>) => {
      const outcomes = parseOutcomes(
        (event.outcomes as Record<string, unknown>[]) ?? [],
      );
      setPrediction((prev) =>
        prev ? { ...prev, outcomes, status: "active" } : null,
      );
    }, []),
  );

  useTwitchEvent(
    "channel.prediction.lock",
    useCallback((event: Record<string, unknown>) => {
      playAlertSound("prediction");
      const outcomes = parseOutcomes(
        (event.outcomes as Record<string, unknown>[]) ?? [],
      );
      setPrediction((prev) =>
        prev ? { ...prev, outcomes, status: "locked" } : null,
      );
    }, []),
  );

  useTwitchEvent(
    "channel.prediction.end",
    useCallback((event: Record<string, unknown>) => {
      const outcomes = parseOutcomes(
        (event.outcomes as Record<string, unknown>[]) ?? [],
      );
      const winId = (event.winning_outcome_id as string) ?? undefined;
      setPrediction((prev) =>
        prev ? { ...prev, outcomes, status: "ended", winningId: winId } : null,
      );
      setTimeout(() => setPrediction(null), 10000);
    }, []),
  );

  const totalPoints = prediction
    ? prediction.outcomes.reduce((s, o) => s + o.channelPoints, 0)
    : 0;

  const badgeClass =
    prediction?.status === "locked"
      ? "rl-prediction__badge rl-prediction__badge--locked"
      : prediction?.status === "ended"
        ? "rl-prediction__badge rl-prediction__badge--ended"
        : "rl-prediction__badge";

  const badgeText =
    prediction?.status === "locked"
      ? "LOCKED"
      : prediction?.status === "ended"
        ? "RESOLVED"
        : "LIVE";

  return (
    <AnimatePresence>
      {prediction && (
        <motion.div
          className="rl-prediction"
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 120, opacity: 0 }}
          transition={{
            type: "spring" as const,
            stiffness: 220,
            damping: 22,
          }}
        >
          <div className="rl-prediction__card">
            <div className="rl-prediction__header">
              <span className={badgeClass}>{badgeText}</span>
            </div>
            <div className="rl-prediction__title">{prediction.title}</div>
            <div className="rl-prediction__outcomes">
              {prediction.outcomes.map((outcome) => {
                const pct =
                  totalPoints > 0
                    ? Math.round((outcome.channelPoints / totalPoints) * 100)
                    : 0;
                const isWinner =
                  prediction.status === "ended" &&
                  outcome.id === prediction.winningId;
                return (
                  <div
                    key={outcome.id}
                    className={`rl-prediction__outcome${isWinner ? " rl-prediction__outcome--winner" : ""}`}
                  >
                    <motion.div
                      className="rl-prediction__outcome-bar"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: totalPoints > 0 ? pct / 100 : 0,
                      }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut" as const,
                      }}
                    />
                    <div className="rl-prediction__outcome-content">
                      <span className="rl-prediction__outcome-label">
                        {outcome.title}
                      </span>
                      <div className="rl-prediction__outcome-stats">
                        <span className="rl-prediction__outcome-pct">
                          {pct}%
                        </span>
                        <span className="rl-prediction__outcome-points">
                          {outcome.channelPoints.toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
