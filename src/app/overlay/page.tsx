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
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const CLIENT_ID_KEY = "grover_gang_client_id";

function OverlayContent({
  cameraLabel,
  username,
}: {
  cameraLabel?: string;
  username?: string;
}) {
  const { alerts, push } = useAlertQueue();

  return (
    <TwitchOverlay>
      <AlertListeners push={push} />

      {/* Scene edge decorations */}
      <div className="rl-scene-edge-top" />
      <div className="rl-scene-edge-bottom" />

      {/* Alert stack — top-right */}
      <div className="rl-alert-stack">
        {alerts.map((alert) => (
          <AlertBox key={alert.id} alert={alert} />
        ))}
      </div>

      {/* Chat — bottom-right */}
      <ChatBox />

      {/* Webcam — bottom-left */}
      <WebcamFrame cameraLabel={cameraLabel} username={username} />
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
