"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTwitchEvent } from "@four-leaf-studios/twitch-overlay";

interface ChatMessage {
  id: string;
  user: string;
  color: string;
  text: string;
}

const MAX_MESSAGES = 50;

const USER_COLORS = [
  "#ff4500",
  "#9147ff",
  "#00c8ff",
  "#ff69b4",
  "#00e5a0",
  "#ffcc00",
  "#1e90ff",
  "#ff6347",
  "#2ecc71",
  "#e67e22",
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
      const msg: ChatMessage = {
        id: (event.message_id as string) ?? crypto.randomUUID(),
        user: event.chatter_user_name as string,
        color:
          (event.color as string) ||
          getUserColor(event.chatter_user_name as string),
        text:
          (event.message as { text: string })?.text ??
          (event.message as string) ??
          "",
      };
      setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), msg]);
    }, []),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "40px",
        right: "40px",
        width: "360px",
        height: "400px",
        display: "flex",
        flexDirection: "column",
        background: "rgba(0, 0, 0, 0.7)",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(8px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          fontSize: "12px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "rgba(255, 255, 255, 0.5)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          flexShrink: 0,
        }}
      >
        Chat
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "40px",
            }}
          >
            No messages yet…
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ fontSize: "14px", lineHeight: "1.4" }}>
            <span style={{ color: msg.color, fontWeight: 700 }}>
              {msg.user}
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 4px" }}>
              :
            </span>
            <span style={{ color: "#e0e0e0" }}>{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
