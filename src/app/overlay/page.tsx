"use client";

import {
  TwitchProvider,
  TwitchOverlay,
} from "@four-leaf-studios/twitch-overlay";
import { TWITCH_SCOPES, TWITCH_SUBSCRIPTIONS } from "@/lib/twitch-config";
import { AlertListeners } from "@/components/alert-listeners/AlertListeners";
import { AlertBox } from "@/components/alert-box/AlertBox";
import { ChatBox } from "@/components/chat-box/ChatBox";
import { WebcamFrame } from "@/components/webcam-frame/WebcamFrame";
import { useAlertQueue } from "@/components/use-alert-queue/useAlertQueue";
import { useSceneManager } from "@/components/scene-manager/useSceneManager";
import { SplashScene } from "@/components/scene-manager/SplashScene";
import { useCountdown } from "@/components/scene-manager/useCountdown";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const CLIENT_ID_KEY = "grover_gang_client_id";

/** Wrapper that fades scene layers in/out */
function SceneLayer({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`rl-scene-layer${active ? " active" : ""}`}>{children}</div>
  );
}

function OverlayContent({
  cameraLabel,
  username,
}: {
  cameraLabel?: string;
  username?: string;
}) {
  const { alerts, push } = useAlertQueue();
  const { activeScene } = useSceneManager();
  const countdown = useCountdown();

  return (
    <TwitchOverlay>
      {/* Alert listeners run in all scenes */}
      <AlertListeners push={push} />

      {/* ── Scene 1: Starting Soon ── */}
      <SceneLayer active={activeScene === "starting-soon"}>
        <SplashScene
          title="Starting Soon"
          subtitle="Hang tight..."
          countdown={countdown}
          accentColor="var(--rl-blue)"
        />
      </SceneLayer>

      {/* ── Scene 2: Gameplay (default) ── */}
      <SceneLayer active={activeScene === "gameplay"}>
        <div className="rl-scene-edge-top" />
        <div className="rl-scene-edge-bottom" />

        <div className="rl-alert-stack">
          {alerts.map((alert) => (
            <AlertBox key={alert.id} alert={alert} />
          ))}
        </div>

        <ChatBox />
        <WebcamFrame cameraLabel={cameraLabel} username={username} />
      </SceneLayer>

      {/* ── Scene 3: Just Chatting ── */}
      <SceneLayer active={activeScene === "just-chatting"}>
        <div className="rl-scene-edge-top" />
        <div className="rl-scene-edge-bottom" />

        <div className="rl-alert-stack">
          {alerts.map((alert) => (
            <AlertBox key={alert.id} alert={alert} />
          ))}
        </div>

        <ChatBox />
        <WebcamFrame cameraLabel={cameraLabel} username={username} />
      </SceneLayer>

      {/* ── Scene 4: BRB ── */}
      <SceneLayer active={activeScene === "brb"}>
        <SplashScene title="Be Right Back" accentColor="var(--rl-orange)" />
      </SceneLayer>

      {/* ── Scene 5: Ending ── */}
      <SceneLayer active={activeScene === "ending"}>
        <SplashScene
          title="Thanks for Watching"
          subtitle="See you next time!"
          accentColor="var(--rl-gold)"
        />
      </SceneLayer>
    </TwitchOverlay>
  );
}

export default function OverlayPage() {
  return (
    <Suspense>
      <OverlayInner />
    </Suspense>
  );
}

function OverlayInner() {
  const searchParams = useSearchParams();
  const [clientId, setClientId] = useState("");
  const [mounted, setMounted] = useState(false);

  const cameraLabel = searchParams.get("cam") ?? undefined;
  const username = searchParams.get("user") ?? undefined;

  useEffect(() => {
    setMounted(true);
    const id =
      process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ??
      localStorage.getItem(CLIENT_ID_KEY) ??
      "";
    setClientId(id);
  }, []);

  if (!mounted) return null;

  if (!clientId) {
    return (
      <div style={{ color: "#ff4500", padding: 40, fontSize: 18 }}>
        No Client ID configured. Open the dashboard first to set it up.
      </div>
    );
  }

  return (
    <TwitchProvider
      clientId={clientId}
      scopes={TWITCH_SCOPES}
      subscriptions={TWITCH_SUBSCRIPTIONS}
    >
      <OverlayContent cameraLabel={cameraLabel} username={username} />
    </TwitchProvider>
  );
}
