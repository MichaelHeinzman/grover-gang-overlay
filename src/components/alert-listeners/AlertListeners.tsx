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
  // ── Core alerts ──

  useTwitchEvent(
    "channel.follow",
    useCallback(
      (event) => {
        push({
          type: "follow",
          title: "New Teammate",
          message: `${event.user_name} joined the squad!`,
          color: "#00AAFF",
          icon: "🏎️",
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
          icon: "🏆",
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
          title: "Boost Pad",
          message: `${event.user_name} cheered ${event.bits} bits!`,
          color: "#FFD700",
          icon: "⚡",
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
          icon: "💥",
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
          icon: "🎯",
        });
      },
      [push],
    ),
  );

  // ── Subscription variants ──

  useTwitchEvent(
    "channel.subscription.message",
    useCallback(
      (event) => {
        const tier = TIER_NAMES[event.tier as string] ?? "Tier 1";
        const months = (event.cumulative_months as number) ?? 0;
        const msg = (event.message as { text?: string })?.text ?? "";
        push({
          type: "resub",
          title: "Resub!",
          message: `${event.user_name} resubbed for ${months} months (${tier})!${msg ? ` "${msg}"` : ""}`,
          color: "#FF8C00",
          icon: "🔄",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.subscription.end",
    useCallback(
      (event) => {
        push({
          type: "info",
          title: "Sub Ended",
          message: `${event.user_name}'s subscription has ended.`,
          color: "#888899",
          icon: "👋",
        });
      },
      [push],
    ),
  );

  // ── Shoutouts ──

  useTwitchEvent(
    "channel.shoutout.create",
    useCallback(
      (event) => {
        push({
          type: "shoutout",
          title: "Shoutout!",
          message: `Shouting out ${event.to_broadcaster_user_name}! Go check them out!`,
          color: "#A855F7",
          icon: "📣",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.shoutout.receive",
    useCallback(
      (event) => {
        push({
          type: "shoutout",
          title: "Shoutout Received!",
          message: `${event.from_broadcaster_user_name} gave us a shoutout!`,
          color: "#A855F7",
          icon: "🌟",
        });
      },
      [push],
    ),
  );

  // ── Charity ──

  useTwitchEvent(
    "channel.charity_campaign.donate",
    useCallback(
      (event) => {
        const amount = event.amount as
          | { value: number; currency: string }
          | undefined;
        const value = amount
          ? `${(amount.value / 100).toFixed(2)} ${amount.currency}`
          : "";
        push({
          type: "charity",
          title: "Charity Donation!",
          message: `${event.user_name} donated ${value} to charity!`,
          color: "#FF69B4",
          icon: "💝",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.charity_campaign.start",
    useCallback(
      (event) => {
        push({
          type: "charity",
          title: "Charity Campaign Started!",
          message: `Supporting: ${(event.charity_name as string) ?? "charity"}`,
          color: "#FF69B4",
          icon: "🎗️",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.charity_campaign.stop",
    useCallback(
      (event) => {
        const raised = event.current_amount as
          | { value: number; currency: string }
          | undefined;
        const total = raised
          ? `${(raised.value / 100).toFixed(2)} ${raised.currency}`
          : "";
        push({
          type: "charity",
          title: "Charity Campaign Ended!",
          message: `Total raised: ${total}`,
          color: "#FF69B4",
          icon: "🏅",
        });
      },
      [push],
    ),
  );

  // ── Moderation / Roles ──

  useTwitchEvent(
    "channel.moderator.add",
    useCallback(
      (event) => {
        push({
          type: "mod",
          title: "New Moderator!",
          message: `${event.user_name} has been modded! 🗡️`,
          color: "#00B894",
          icon: "🛡️",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.moderator.remove",
    useCallback(
      (event) => {
        push({
          type: "info",
          title: "Mod Removed",
          message: `${event.user_name} is no longer a moderator.`,
          color: "#636E72",
          icon: "🛡️",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.vip.add",
    useCallback(
      (event) => {
        push({
          type: "mod",
          title: "New VIP!",
          message: `${event.user_name} is now a VIP! ✨`,
          color: "#E056A0",
          icon: "💎",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.vip.remove",
    useCallback(
      (event) => {
        push({
          type: "info",
          title: "VIP Removed",
          message: `${event.user_name} is no longer a VIP.`,
          color: "#636E72",
          icon: "💎",
        });
      },
      [push],
    ),
  );

  // ── Stream status ──

  useTwitchEvent(
    "stream.online",
    useCallback(() => {
      push({
        type: "info",
        title: "Stream Online!",
        message: "The stream is now live!",
        color: "#00FF88",
        icon: "🔴",
      });
    }, [push]),
  );

  useTwitchEvent(
    "stream.offline",
    useCallback(() => {
      push({
        type: "info",
        title: "Stream Offline",
        message: "The stream has ended.",
        color: "#636E72",
        icon: "⭕",
      });
    }, [push]),
  );

  // ── Misc ──

  useTwitchEvent(
    "channel.update",
    useCallback(
      (event) => {
        const title = (event.title as string) ?? "";
        const category = (event.category_name as string) ?? "";
        push({
          type: "info",
          title: "Channel Updated",
          message: `${title}${category ? ` — ${category}` : ""}`,
          color: "#74B9FF",
          icon: "📝",
        });
      },
      [push],
    ),
  );

  useTwitchEvent(
    "channel.ad_break.begin",
    useCallback(
      (event) => {
        const duration = (event.duration_seconds as number) ?? 0;
        push({
          type: "info",
          title: "Ad Break",
          message: `Ad break started (${duration}s)`,
          color: "#FDCB6E",
          icon: "📺",
        });
      },
      [push],
    ),
  );

  return null;
}
