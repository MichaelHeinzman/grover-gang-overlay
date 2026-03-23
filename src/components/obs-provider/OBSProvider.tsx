"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import OBSWebSocket from "obs-websocket-js";
import type { JsonObject } from "type-fest";
import { STORAGE_KEYS, OBS_DEFAULTS } from "@/lib/storage-keys";

// ── Types ──

type OBSEventHandler = (data: Record<string, unknown>) => void;

interface OBSContextValue {
  /** Whether we're connected to OBS WebSocket */
  connected: boolean;
  /** Broadcast a custom event to all connected OBS WS clients */
  broadcast: (eventData: Record<string, unknown>) => void;
  /** Subscribe to a specific OBS event by name. Returns unsubscribe fn. */
  on: (event: string, handler: OBSEventHandler) => () => void;
}

const OBSContext = createContext<OBSContextValue | null>(null);

export function useOBS(): OBSContextValue {
  const ctx = useContext(OBSContext);
  if (!ctx) {
    throw new Error("useOBS must be used within <OBSProvider>");
  }
  return ctx;
}

// ── Provider ──

export function OBSProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const obsRef = useRef<OBSWebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<OBSEventHandler>>>(new Map());

  const broadcast = useCallback((eventData: Record<string, unknown>) => {
    const obs = obsRef.current;
    if (!obs) return;
    obs
      .call("BroadcastCustomEvent", { eventData: eventData as JsonObject })
      .catch((err: unknown) => {
        console.warn("[OBS] BroadcastCustomEvent failed:", err);
      });
  }, []);

  const on = useCallback((event: string, handler: OBSEventHandler) => {
    const map = listenersRef.current;
    if (!map.has(event)) map.set(event, new Set());
    map.get(event)!.add(handler);
    return () => {
      map.get(event)?.delete(handler);
    };
  }, []);

  useEffect(() => {
    const obs = new OBSWebSocket();
    obsRef.current = obs;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let disposed = false;
    let wasConnected = false;
    let retryCount = 0;

    function scheduleReconnect() {
      if (disposed) return;
      const delay = Math.min(5000 * Math.pow(2, retryCount), 30_000);
      retryCount++;
      reconnectTimer = setTimeout(connect, delay);
    }

    async function connect() {
      if (disposed) return;

      const tunnelUrl = (
        localStorage.getItem(STORAGE_KEYS.OBS_WS_TUNNEL_URL) ||
        process.env.NEXT_PUBLIC_OBS_WS_TUNNEL_URL ||
        ""
      ).trim();
      let url: string;

      if (tunnelUrl) {
        url = tunnelUrl.replace(/^https?:\/\//, "wss://").replace(/\/$/, "");
      } else {
        const ip =
          localStorage.getItem(STORAGE_KEYS.OBS_WS_IP) ?? OBS_DEFAULTS.IP;
        const port =
          localStorage.getItem(STORAGE_KEYS.OBS_WS_PORT) ?? OBS_DEFAULTS.PORT;
        url = `ws://${ip}:${port}`;
      }

      const password =
        localStorage.getItem(STORAGE_KEYS.OBS_WS_PASSWORD) ||
        process.env.NEXT_PUBLIC_OBS_WS_PASSWORD ||
        "";

      try {
        await obs.connect(url, password || undefined);
        if (disposed) return;
        console.log("[OBS] Connected to", url);
        wasConnected = true;
        retryCount = 0;
        setConnected(true);
      } catch (err: unknown) {
        // Ignore errors from Strict Mode teardown (cleanup called disconnect mid-connect)
        if (disposed) return;
        if (retryCount === 0) {
          console.warn("[OBS] Connection failed:", err);
        }
        scheduleReconnect();
      }
    }

    // Forward all OBS events to registered listeners
    function dispatch(event: string, data: Record<string, unknown>) {
      listenersRef.current.get(event)?.forEach((fn) => fn(data));
    }

    obs.on("SceneTransitionStarted", () =>
      dispatch("SceneTransitionStarted", {}),
    );

    obs.on("CurrentProgramSceneChanged", (data) =>
      dispatch(
        "CurrentProgramSceneChanged",
        data as unknown as Record<string, unknown>,
      ),
    );

    obs.on("CustomEvent", (data) =>
      dispatch("CustomEvent", data as unknown as Record<string, unknown>),
    );

    obs.on("ConnectionClosed", () => {
      setConnected(false);
      if (!wasConnected) return;
      wasConnected = false;
      console.warn("[OBS] Disconnected, reconnecting…");
      scheduleReconnect();
    });

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      obs.disconnect();
      obsRef.current = null;
    };
  }, []);

  return (
    <OBSContext.Provider value={{ connected, broadcast, on }}>
      {children}
    </OBSContext.Provider>
  );
}
