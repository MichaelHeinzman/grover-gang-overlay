"use client";

import {
  TwitchProvider,
  TwitchOverlay,
} from "@four-leaf-studios/twitch-overlay";
import { TWITCH_SCOPES, TWITCH_SUBSCRIPTIONS } from "@/lib/twitch-config";
import { AlertListeners } from "@/components/AlertListeners";
import { AlertBox } from "@/components/AlertBox";
import { ChatBox } from "@/components/ChatBox";
import { useAlertQueue } from "@/components/useAlertQueue";
import { useState, useEffect } from "react";

const CLIENT_ID_KEY = "grover_gang_client_id";

function OverlayContent() {
  const { alerts, push } = useAlertQueue();

  return (
    <TwitchOverlay>
      <AlertListeners push={push} />

      {/* Alert stack — top-right */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          right: "40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        {alerts.map((alert) => (
          <AlertBox key={alert.id} alert={alert} />
        ))}
      </div>

      {/* Chat — bottom-right */}
      <ChatBox />
    </TwitchOverlay>
  );
}

export default function OverlayPage() {
  const [clientId, setClientId] = useState("");
  const [mounted, setMounted] = useState(false);

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
      <OverlayContent />
    </TwitchProvider>
  );
}
