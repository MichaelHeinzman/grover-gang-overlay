"use client";

import type { AlertItem } from "./useAlertQueue";

export function AlertBox({ alert }: { alert: AlertItem }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 24px",
        marginBottom: "8px",
        borderRadius: "8px",
        background: "rgba(0, 0, 0, 0.85)",
        borderLeft: `4px solid ${alert.color}`,
        color: "#fff",
        fontSize: "16px",
        minWidth: "320px",
        maxWidth: "450px",
        animation: alert.exiting
          ? "slideOutRight 0.4s ease-in forwards"
          : "slideInRight 0.4s ease-out forwards",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
      }}
    >
      <span style={{ fontSize: "28px", flexShrink: 0 }}>{alert.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: alert.color,
            marginBottom: "2px",
          }}
        >
          {alert.title}
        </div>
        <div
          style={{
            fontSize: "15px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {alert.message}
        </div>
      </div>
    </div>
  );
}
