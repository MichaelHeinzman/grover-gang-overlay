"use client";

import { useState, type ReactNode } from "react";

const STORAGE_PREFIX = "grover_gang_accordion_";

export function Accordion({
  title,
  id,
  defaultOpen = false,
  children,
}: {
  title: string;
  /** Unique key used to persist open/closed state in localStorage */
  id: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen;
    const stored = localStorage.getItem(STORAGE_PREFIX + id);
    if (stored !== null) return stored === "1";
    return defaultOpen;
  });

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_PREFIX + id, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div
      style={{
        marginTop: 24,
        borderRadius: 8,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={toggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "none",
          border: "none",
          color: "#ededed",
          cursor: "pointer",
          fontSize: 16,
          fontWeight: 700,
          textAlign: "left",
        }}
      >
        {title}
        <span
          style={{
            fontSize: 12,
            color: "#888",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}
