"use client";

import { useCallback } from "react";
import { useTwitchEvent } from "@four-leaf-studios/twitch-overlay";
import type { AlertItem } from "./useAlertQueue";

const TIER_NAMES: Record<string, string> = {
  "1000": "Tier 1",
  "2000": "Tier 2",
  "3000": "Tier 3",
};

export function AlertListeners({
  push,
}: {
  push: (alert: Omit<AlertItem, "id">) => void;
}) {
  useTwitchEvent(
    "channel.follow",
    useCallback(
      (event) => {
        push({
          type: "follow",
          title: "New Follower",
          message: `${event.user_name} just followed!`,
          color: "#9147ff",
          icon: "💜",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.subscribe",
    useCallback(
      (event) => {
        const tier = TIER_NAMES[event.tier as string] ?? "Tier 1";
        push({
          type: "subscribe",
          title: "New Subscriber",
          message: `${event.user_name} subscribed (${tier})!`,
          color: "#00c8ff",
          icon: "⭐",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.subscription.gift",
    useCallback(
      (event) => {
        const total = event.total as number;
        push({
          type: "gift",
          title: "Gift Subs",
          message: `${event.user_name} gifted ${total} sub${total > 1 ? "s" : ""}!`,
          color: "#ff69b4",
          icon: "🎁",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.cheer",
    useCallback(
      (event) => {
        push({
          type: "cheer",
          title: "Cheer",
          message: `${event.user_name} cheered ${event.bits} bits!`,
          color: "#ffcc00",
          icon: "💎",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.raid",
    useCallback(
      (event) => {
        push({
          type: "raid",
          title: "Raid Incoming!",
          message: `${event.from_broadcaster_user_name} raided with ${event.viewers} viewers!`,
          color: "#ff4500",
          icon: "🚀",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.channel_points_custom_reward_redemption.add",
    useCallback(
      (event) => {
        const reward = event.reward as { title: string; cost: number };
        push({
          type: "redemption",
          title: "Point Redemption",
          message: `${event.user_name} redeemed "${reward.title}" (${reward.cost} pts)`,
          color: "#00e5a0",
          icon: "🏆",
        });
      },
      [push],
    ),
  );

  return null;
}
