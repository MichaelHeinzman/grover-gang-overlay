"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTwitchEvent } from "@four-leaf-studios/twitch-overlay";
import { playAlertSound } from "@/lib/alert-sounds";
import "./poll-overlay.css";

interface PollChoice {
  id: string;
  title: string;
  votes: number;
}

interface PollState {
  title: string;
  choices: PollChoice[];
  status: "active" | "ended";
}

export function PollOverlay() {
  const [poll, setPoll] = useState<PollState | null>(null);

  const parsePoll = useCallback(
    (event: Record<string, unknown>, status: "active" | "ended") => {
      const choices =
        (event.choices as { id: string; title: string; votes?: number }[])?.map(
          (c) => ({
            id: c.id,
            title: c.title,
            votes: c.votes ?? 0,
          }),
        ) ?? [];
      return {
        title: (event.title as string) ?? "Poll",
        choices,
        status,
      };
    },
    [],
  );

  useTwitchEvent(
    "channel.poll.begin",
    useCallback(
      (event: Record<string, unknown>) => {
        playAlertSound("poll");
        setPoll(parsePoll(event, "active"));
      },
      [parsePoll],
    ),
  );

  useTwitchEvent(
    "channel.poll.progress",
    useCallback(
      (event: Record<string, unknown>) => {
        setPoll(parsePoll(event, "active"));
      },
      [parsePoll],
    ),
  );

  useTwitchEvent(
    "channel.poll.end",
    useCallback(
      (event: Record<string, unknown>) => {
        setPoll(parsePoll(event, "ended"));
        setTimeout(() => setPoll(null), 8000);
      },
      [parsePoll],
    ),
  );

  const totalVotes = poll?.choices.reduce((s, c) => s + c.votes, 0) ?? 0;
  const maxVotes = poll ? Math.max(...poll.choices.map((c) => c.votes), 1) : 1;

  return (
    <AnimatePresence>
      {poll && (
        <motion.div
          className="rl-poll"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{
            type: "spring" as const,
            stiffness: 220,
            damping: 22,
          }}
        >
          <div className="rl-poll__card">
            <div className="rl-poll__title">
              📊 {poll.status === "ended" ? "Poll Results" : "Live Poll"}
            </div>
            <div className="rl-poll__question">{poll.title}</div>
            <div className="rl-poll__choices">
              {poll.choices.map((choice) => {
                const pct =
                  totalVotes > 0
                    ? Math.round((choice.votes / totalVotes) * 100)
                    : 0;
                const isWinner =
                  poll.status === "ended" && choice.votes === maxVotes;
                return (
                  <div key={choice.id} className="rl-poll__choice">
                    <motion.div
                      className={`rl-poll__choice-bar${isWinner ? " rl-poll__choice-bar--winner" : ""}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: totalVotes > 0 ? pct / 100 : 0 }}
                      transition={{
                        duration: 0.5,
                        ease: "easeOut" as const,
                      }}
                    />
                    <div className="rl-poll__choice-content">
                      <span className="rl-poll__choice-label">
                        {choice.title}
                      </span>
                      <span className="rl-poll__choice-votes">
                        {pct}% ({choice.votes})
                      </span>
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
