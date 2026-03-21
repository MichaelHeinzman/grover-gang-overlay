import type { TwitchSubscriptionConfig } from "@four-leaf-studios/twitch-overlay";

export const TWITCH_SCOPES = [
  "channel:read:subscriptions",
  "channel:read:redemptions",
  "bits:read",
  "moderator:read:followers",
  "user:read:chat",
];

export const TWITCH_SUBSCRIPTIONS: TwitchSubscriptionConfig[] = [
  { type: "channel.follow", version: "2" },
  { type: "channel.subscribe", version: "1" },
  { type: "channel.subscription.gift", version: "1" },
  { type: "channel.cheer", version: "1" },
  { type: "channel.raid", version: "1" },
  { type: "channel.channel_points_custom_reward_redemption.add", version: "1" },
  { type: "channel.chat.message", version: "1" },
];
