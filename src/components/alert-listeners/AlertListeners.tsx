"use client";

import { useCallback } from "react";
import { useTwitchEvent } from "@four-leaf-studios/twitch-overlay";
import type { AlertItem } from "../use-alert-queue/useAlertQueue";

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
          title: "New Teammate",
          message: `${event.user_name} joined the squad!`,
          color: "#00AAFF",
          icon: "\ud83c\udfce\ufe0f",
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
          title: "Ranked Up",
          message: `${event.user_name} subscribed (${tier})!`,
          color: "#FF8C00",
          icon: "\ud83c\udfc6",
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
          title: "Gift Drop",
          message: `${event.user_name} gifted ${total} sub${total > 1 ? "s" : ""}!`,
          color: "#00E5FF",
          icon: "\ud83c\udf81",
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
          title: "Boost Pad",
          message: `${event.user_name} cheered ${event.bits} bits!`,
          color: "#FFD700",
          icon: "\u26a1",
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
          title: "Demolition!",
          message: `${event.from_broadcaster_user_name} raided with ${event.viewers} viewers!`,
          color: "#FF4500",
          icon: "\ud83d\udca5",
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
          title: "Item Drop",
          message: `${event.user_name} redeemed "${reward.title}" (${reward.cost} pts)`,
          color: "#00FF88",
          icon: "\ud83c\udfaf",
        });
      },
      [push],
    ),
  );

  return null;
}
