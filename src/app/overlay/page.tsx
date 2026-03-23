"use client";

import {
  TwitchProvider,
  TwitchOverlay,
} from "@four-leaf-studios/twitch-overlay";
import { TWITCH_SCOPES, TWITCH_SUBSCRIPTIONS } from "@/lib/twitch-config";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { AlertListeners } from "@/components/alert-listeners/AlertListeners";
import { AlertBox } from "@/components/alert-box/AlertBox";
import { ChatBox } from "@/components/chat-box/ChatBox";
import { WebcamFrame } from "@/components/webcam-frame/WebcamFrame";
import { useAlertQueue } from "@/components/use-alert-queue/useAlertQueue";
import { HypeTrainBar } from "@/components/hype-train/HypeTrainBar";
import { InfoTicker } from "@/components/info-ticker/InfoTicker";
import { PollOverlay } from "@/components/poll-overlay/PollOverlay";
import { PredictionOverlay } from "@/components/prediction-overlay/PredictionOverlay";
import { SceneManagerProvider } from "@/components/scene-manager/SceneManagerProvider";
import { SceneLayer } from "@/components/scene-manager/SceneLayer";
import { SplashScene } from "@/components/scene-manager/SplashScene";
import { SceneTransition } from "@/components/scene-manager/SceneTransition";
import { useCountdown } from "@/components/scene-manager/useCountdown";
import { OBSProvider, useOBS } from "@/components/obs-provider/OBSProvider";
import { useState, useEffect } from "react";

// ── Cached config helpers ──

interface OverlayConfig {
  clientId: string;
  cameraLabel: string;
  username: string;
}

function loadCachedConfig(): OverlayConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OBS_CONFIG_CACHE);
    if (raw) return JSON.parse(raw) as OverlayConfig;
  } catch {
    /* ignore */
  }
  return { clientId: "", cameraLabel: "", username: "" };
}

function saveCachedConfig(config: OverlayConfig) {
  localStorage.setItem(STORAGE_KEYS.OBS_CONFIG_CACHE, JSON.stringify(config));
}

// ── Overlay content (unchanged) ──

function OverlayContent({
  cameraLabel,
  username,
}: {
  cameraLabel?: string;
  username?: string;
}) {
  const { alerts, push } = useAlertQueue();
  const countdown = useCountdown();

  return (
    <TwitchOverlay>
      <AlertListeners push={push} />

      <SceneTransition />

      {/* Interactive overlay widgets (visible on all scenes) */}
      <HypeTrainBar />
      <InfoTicker />
      <PollOverlay />
      <PredictionOverlay />

      <div className="rl-alert-stack">
        {alerts.map((alert) => (
          <AlertBox key={alert.id} alert={alert} />
        ))}
      </div>

      <SceneLayer sceneName="starting-soon">
        <SplashScene
          sceneName="starting-soon"
          title="Starting Soon"
          subtitle="Hang tight..."
          countdown={countdown}
          accentColor="var(--rl-blue)"
        />
        <ChatBox />
      </SceneLayer>

      <SceneLayer sceneName="gameplay">
        <div className="rl-scene-edge-top" />
        <div className="rl-scene-edge-bottom" />
        <ChatBox />
        <WebcamFrame cameraLabel={cameraLabel} username={username} />
      </SceneLayer>

      <SceneLayer sceneName="just-chatting">
        <div className="rl-scene-edge-top" />
        <div className="rl-scene-edge-bottom" />
        <ChatBox />
        <WebcamFrame cameraLabel={cameraLabel} username={username} />
      </SceneLayer>

      <SceneLayer sceneName="brb">
        <SplashScene
          sceneName="brb"
          title="Be Right Back"
          accentColor="var(--rl-orange)"
        />
        <ChatBox />
      </SceneLayer>

      <SceneLayer sceneName="ending">
        <SplashScene
          sceneName="ending"
          title="Thanks for Watching"
          subtitle="See you next time!"
          accentColor="var(--rl-gold)"
        />
        <ChatBox />
      </SceneLayer>
    </TwitchOverlay>
  );
}

export default function OverlayPage() {
  return (
    <OBSProvider>
      <OverlayConfigGate />
    </OBSProvider>
  );
}

/**
 * Listens for overlay config via OBS BroadcastCustomEvent.
 * Falls back to cached localStorage → URL params → env vars.
 */
function OverlayConfigGate() {
  const { on } = useOBS();
  const [config, setConfig] = useState<OverlayConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load fallback config on mount
  useEffect(() => {
    setMounted(true);

    // Build fallback config: cached OBS config → URL params → env vars → localStorage
    const cached = loadCachedConfig();
    const params = new URLSearchParams(window.location.search);

    const clientId =
      cached.clientId ||
      process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ||
      localStorage.getItem(STORAGE_KEYS.CLIENT_ID) ||
      "";
    const cameraLabel = cached.cameraLabel || params.get("cam") || "";
    const username = cached.username || params.get("user") || "";

    setConfig({ clientId, cameraLabel, username });
  }, []);

  // Listen for live config updates from dashboard via OBS
  useEffect(() => {
    return on("CustomEvent", (data) => {
      if (data.type !== "grover-gang-config") return;

      const incoming: OverlayConfig = {
        clientId: (data.clientId as string) || "",
        cameraLabel: (data.cameraLabel as string) || "",
        username: (data.username as string) || "",
      };

      // Cache for next startup
      saveCachedConfig(incoming);

      setConfig((prev) => ({
        clientId: incoming.clientId || prev?.clientId || "",
        cameraLabel: incoming.cameraLabel || prev?.cameraLabel || "",
        username: incoming.username || prev?.username || "",
      }));

      console.log("[OBS Config] Received config update:", incoming);
    });
  }, [on]);

  if (!mounted) return null;

  const clientId = config?.clientId || "";

  if (!clientId) {
    return (
      <div style={{ color: "#ff4500", padding: 40, fontSize: 18 }}>
        No Client ID configured. Open the dashboard first to set it up, or
        broadcast config from the dashboard via OBS.
      </div>
    );
  }

  return (
    <TwitchProvider
      clientId={clientId}
      scopes={TWITCH_SCOPES}
      subscriptions={TWITCH_SUBSCRIPTIONS}
    >
      <SceneManagerProvider>
        <OverlayContent
          cameraLabel={config?.cameraLabel || undefined}
          username={config?.username || undefined}
        />
      </SceneManagerProvider>
    </TwitchProvider>
  );
}
