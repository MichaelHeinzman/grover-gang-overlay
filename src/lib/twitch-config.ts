import type { TwitchSubscriptionConfig } from "@four-leaf-studios/twitch-overlay";

export const TWITCH_SCOPES = [
  "channel:read:subscriptions",
  "channel:read:redemptions",
  "channel:read:polls",
  "channel:read:predictions",
  "channel:read:goals",
  "channel:read:hype_train",
  "channel:read:charity",
  "channel:read:vips",
  "channel:read:ads",
  "channel:manage:polls",
  "channel:manage:predictions",
  "moderation:read",
  "bits:read",
  "moderator:read:followers",
  "moderator:read:shoutouts",
  "user:read:chat",
];

export const TWITCH_SUBSCRIPTIONS: TwitchSubscriptionConfig[] = [
  // ── Core alerts ──
  { type: "channel.follow", version: "2" },
  { type: "channel.subscribe", version: "1" },
  { type: "channel.subscription.gift", version: "1" },
  { type: "channel.cheer", version: "1" },
  { type: "channel.raid", version: "1" },
  { type: "channel.channel_points_custom_reward_redemption.add", version: "1" },
  { type: "channel.chat.message", version: "1" },

  // ── Subscription variants ──
  { type: "channel.subscription.message", version: "1" },
  { type: "channel.subscription.end", version: "1" },

  // ── Hype Train ──
  { type: "channel.hype_train.begin", version: "2" },
  { type: "channel.hype_train.progress", version: "2" },
  { type: "channel.hype_train.end", version: "2" },

  // ── Goals ──
  { type: "channel.goal.begin", version: "1" },
  { type: "channel.goal.progress", version: "1" },
  { type: "channel.goal.end", version: "1" },

  // ── Shoutouts ──
  // Note: shoutout events require moderator_user_id in the condition,
  // which the library can't auto-populate. These would need a custom
  // dynamic subscription mechanism to work.

  // ── Charity ──
  { type: "channel.charity_campaign.donate", version: "1" },
  { type: "channel.charity_campaign.start", version: "1" },
  { type: "channel.charity_campaign.progress", version: "1" },
  { type: "channel.charity_campaign.stop", version: "1" },

  // ── Polls ──
  { type: "channel.poll.begin", version: "1" },
  { type: "channel.poll.progress", version: "1" },
  { type: "channel.poll.end", version: "1" },

  // ── Predictions ──
  { type: "channel.prediction.begin", version: "1" },
  { type: "channel.prediction.progress", version: "1" },
  { type: "channel.prediction.lock", version: "1" },
  { type: "channel.prediction.end", version: "1" },

  // ── Moderation / Roles ──
  { type: "channel.moderator.add", version: "1" },
  { type: "channel.moderator.remove", version: "1" },
  { type: "channel.vip.add", version: "1" },
  { type: "channel.vip.remove", version: "1" },

  // ── Stream status ──
  { type: "stream.online", version: "1" },
  { type: "stream.offline", version: "1" },

  // ── Misc ──
  { type: "channel.update", version: "2" },
  { type: "channel.ad_break.begin", version: "1" },
];
