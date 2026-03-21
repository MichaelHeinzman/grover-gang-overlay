"use client";

import { useEffect, useRef, useState } from "react";

const STREAM_START_KEY = "grover_gang_stream_start";
const CHANNEL_NAME = "grover-gang-countdown";

/** Save and broadcast a stream start time (ISO string). */
export function setStreamStartTime(isoString: string) {
  localStorage.setItem(STREAM_START_KEY, isoString);
  const bc = new BroadcastChannel(CHANNEL_NAME);
  bc.postMessage({ type: "start-time", time: isoString });
  bc.close();
}

/** Clear the countdown. */
export function clearStreamStartTime() {
  localStorage.removeItem(STREAM_START_KEY);
  const bc = new BroadcastChannel(CHANNEL_NAME);
  bc.postMessage({ type: "start-time", time: "" });
  bc.close();
}

function formatDiff(diff: number): string {
  if (diff <= 0) return "Starting now!";
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1_000);
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * Returns a live countdown string like "12:34" or "Starting now!"
 * Listens for BroadcastChannel updates from the dashboard.
 */
export function useCountdown() {
  const targetRef = useRef(
    typeof window !== "undefined"
      ? (localStorage.getItem(STREAM_START_KEY) ?? "")
      : "",
  );
  const [display, setDisplay] = useState("");

  // Listen for broadcast updates from dashboard
  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (e) => {
      if (e.data?.type === "start-time") {
        targetRef.current = e.data.time ?? "";
      }
    };
    return () => bc.close();
  }, []);

  // Tick every second
  useEffect(() => {
    function tick() {
      const target = targetRef.current;
      if (!target) {
        setDisplay("");
        return;
      }
      const diff = new Date(target).getTime() - Date.now();
      setDisplay(formatDiff(diff));
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return display;
}
