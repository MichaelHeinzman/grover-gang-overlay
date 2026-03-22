"use client";

import { useEffect, useRef } from "react";
import OBSWebSocket from "obs-websocket-js";
import { STORAGE_KEYS, OBS_DEFAULTS } from "@/lib/storage-keys";

export interface OBSCallbacks {
  onSceneTransitionStarted?: () => void;
  onSceneChanged?: (sceneName: string) => void;
}

/**
 * Manages a single OBS WebSocket connection with auto-reconnect.
 * Reads connection settings from localStorage.
 */
export function useOBSWebSocket(callbacks: OBSCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const obs = new OBSWebSocket();
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let disposed = false;
    let wasConnected = false;
    let retryCount = 0;

    function scheduleReconnect() {
      if (disposed) return;
      const delay = Math.min(5000 * Math.pow(2, retryCount), 30000);
      retryCount++;
      reconnectTimer = setTimeout(connect, delay);
    }

    async function connect() {
      if (disposed) return;
      const ip =
        localStorage.getItem(STORAGE_KEYS.OBS_WS_IP) ?? OBS_DEFAULTS.IP;
      const port =
        localStorage.getItem(STORAGE_KEYS.OBS_WS_PORT) ?? OBS_DEFAULTS.PORT;
      const url = `ws://${ip}:${port}`;
      const password = localStorage.getItem(STORAGE_KEYS.OBS_WS_PASSWORD) ?? "";

      try {
        await obs.connect(url, password || undefined);
        console.log("[OBS-WS] Connected to", url);
        wasConnected = true;
        retryCount = 0;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (retryCount === 0) {
          console.error(`[OBS-WS] Connection failed: ${msg}`);
        }
        scheduleReconnect();
      }
    }

    obs.on("SceneTransitionStarted", () => {
      callbacksRef.current.onSceneTransitionStarted?.();
    });

    obs.on("CurrentProgramSceneChanged", (data) => {
      callbacksRef.current.onSceneChanged?.(data.sceneName);
    });

    obs.on("ConnectionClosed", () => {
      if (!wasConnected) return;
      wasConnected = false;
      console.warn("[OBS-WS] Disconnected, reconnecting…");
      scheduleReconnect();
    });

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      obs.disconnect();
    };
  }, []);
}
