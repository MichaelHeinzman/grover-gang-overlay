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
import {
  SceneManagerProvider,
  useSceneManager,
} from "@/components/scene-manager/SceneManagerProvider";
import { SceneLayer } from "@/components/scene-manager/SceneLayer";
import { SplashScene } from "@/components/scene-manager/SplashScene";
import { SceneTransition } from "@/components/scene-manager/SceneTransition";
import { useCountdown } from "@/components/scene-manager/useCountdown";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

      <SceneLayer sceneName="starting-soon">
        <SplashScene
          title="Starting Soon"
          subtitle="Hang tight..."
          countdown={countdown}
          accentColor="var(--rl-blue)"
        />
      </SceneLayer>

      <SceneLayer sceneName="gameplay">
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

      <SceneLayer sceneName="just-chatting">
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

      <SceneLayer sceneName="brb">
        <SplashScene title="Be Right Back" accentColor="var(--rl-orange)" />
      </SceneLayer>

      <SceneLayer sceneName="ending">
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
      localStorage.getItem(STORAGE_KEYS.CLIENT_ID) ??
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
      <SceneManagerProvider>
        <OverlayContent cameraLabel={cameraLabel} username={username} />
      </SceneManagerProvider>
    </TwitchProvider>
  );
}
