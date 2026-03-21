"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTwitchEvent } from "@four-leaf-studios/twitch-overlay";
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
}

const MAX_MESSAGES = 50;

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
  const bottomRef = useRef<HTMLDivElement>(null);

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
      };
      setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), msg]);
    }, []),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="rl-chat">
      <div className="rl-chat__accent-top" />
      <div className="rl-chat__accent-bottom" />
      <div className="rl-chat__header">&#9670; Team Chat</div>
      <div className="rl-chat__scanline" />
      <div className="rl-chat__messages">
        {messages.length === 0 && (
          <div className="rl-chat__empty">Waiting for kickoff...</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="rl-chat__msg">
            <span
              className="rl-chat__msg-user"
              style={{
                color: msg.color,
                textShadow: `0 0 6px ${msg.color}44`,
              }}
            >
              {msg.user}
            </span>
            <span className="rl-chat__msg-sep">&raquo;</span>
            <span className="rl-chat__msg-text">
              {msg.fragments.map((frag, i) =>
                frag.type === "emote" && frag.emote ? (
                  <img
                    key={i}
                    src={`https://static-cdn.jtvnw.net/emoticons/v2/${frag.emote.id}/${frag.emote.format?.includes("animated") ? "animated" : "static"}/dark/1.0`}
                    alt={frag.text}
                    title={frag.text}
                    className="rl-chat__emote"
                  />
                ) : (
                  <span key={i}>{frag.text}</span>
                ),
              )}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
