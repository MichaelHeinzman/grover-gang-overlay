"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTwitchEvent } from "@four-leaf-studios/twitch-overlay";
import { useWidgetTransition } from "@/hooks/useWidgetTransition";
import "./chat-box.css";

interface MessageFragment {
  type: "text" | "emote" | "cheermote" | "mention";
  text: string;
  emote?: { id: string; format: string[] } | null;
}

interface ChatMessage {
  id: string;
  user: string;
  color: string;
  fragments: MessageFragment[];
  ts: number;
}

const MAX_MESSAGES = 5;
const MSG_LIFETIME_MS = 60_000;

const USER_COLORS = [
  "#00AAFF",
  "#FF8C00",
  "#00D4FF",
  "#FFB347",
  "#3DB8FF",
  "#FF6B00",
  "#00E5FF",
  "#FFA500",
  "#66CCFF",
  "#FF9933",
];

function getUserColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const containerTransition = useWidgetTransition("right", { delay: 0.05 });

  useTwitchEvent(
    "channel.chat.message",
    useCallback((event) => {
      const rawMsg = event.message as {
        text: string;
        fragments?: MessageFragment[];
      };
      const fragments: MessageFragment[] = rawMsg?.fragments?.length
        ? rawMsg.fragments
        : [{ type: "text", text: rawMsg?.text ?? String(event.message) }];

      const msg: ChatMessage = {
        id: (event.message_id as string) ?? crypto.randomUUID(),
        user: event.chatter_user_name as string,
        color:
          (event.color as string) ||
          getUserColor(event.chatter_user_name as string),
        fragments,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, msg].slice(-MAX_MESSAGES));
    }, []),
  );

  // Auto-expire old messages
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setInterval(() => {
      const cutoff = Date.now() - MSG_LIFETIME_MS;
      setMessages((prev) => prev.filter((m) => m.ts > cutoff));
    }, 5000);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <motion.div className="rl-chat" {...containerTransition}>
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className="rl-chat-msg"
            style={{ "--_msg-color": msg.color } as React.CSSProperties}
            initial={{ opacity: 0, x: 60, scale: 0.9, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 40, scale: 0.95, filter: "blur(4px)" }}
            transition={{
              duration: 0.4,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          >
            <div className="rl-chat-msg__accent" />
            <div className="rl-chat-msg__scanline" />
            <motion.span
              className="rl-chat-msg__user"
              style={{
                color: msg.color,
                textShadow: `0 0 8px ${msg.color}55`,
              }}
              initial={{ opacity: 0, letterSpacing: "6px" }}
              animate={{ opacity: 1, letterSpacing: "1px" }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              {msg.user}
            </motion.span>
            <motion.span
              className="rl-chat-msg__text"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              {msg.fragments.map((frag, i) =>
                frag.type === "emote" && frag.emote ? (
                  <img
                    key={i}
                    src={`https://static-cdn.jtvnw.net/emoticons/v2/${frag.emote.id}/${frag.emote.format?.includes("animated") ? "animated" : "static"}/dark/1.0`}
                    alt={frag.text}
                    title={frag.text}
                    className="rl-chat-msg__emote"
                  />
                ) : (
                  <span key={i}>{frag.text}</span>
                ),
              )}
            </motion.span>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
