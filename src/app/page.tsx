"use client";

import {
  TwitchProvider,
  useTwitchAuth,
  useTwitchConnection,
} from "@four-leaf-studios/twitch-overlay";
import { TWITCH_SCOPES, TWITCH_SUBSCRIPTIONS } from "@/lib/twitch-config";
import { useState, useEffect } from "react";

const CLIENT_ID_KEY = "grover_gang_client_id";

function getClientId(): string {
  if (typeof window === "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ??
    localStorage.getItem(CLIENT_ID_KEY) ??
    ""
  );
}

function DashboardContent() {
  const { token, loading, login, logout } = useTwitchAuth();
  const connection = useTwitchConnection();

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Grover Gang Overlay
      </h1>
      <p style={{ color: "#888", marginBottom: 32 }}>
        Dashboard — sign in with Twitch, then add your overlay URL to OBS.
      </p>

      {/* Connection Status */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: 8,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "#888",
            marginBottom: 4,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Connection
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background:
                connection.status === "connected"
                  ? "#00e5a0"
                  : connection.status === "connecting"
                    ? "#ffcc00"
                    : "#ff4500",
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 600 }}>
            {connection.status.charAt(0).toUpperCase() +
              connection.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Auth */}
      {loading ? (
        <p style={{ color: "#888" }}>Checking auth…</p>
      ) : token ? (
        <div>
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 8,
              background: "rgba(145, 71, 255, 0.1)",
              border: "1px solid rgba(145, 71, 255, 0.3)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#9147ff",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Logged in as
            </div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{token.login}</span>
          </div>
          <button
            onClick={logout}
            style={{
              padding: "10px 24px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={login}
          style={{
            padding: "12px 28px",
            borderRadius: 6,
            border: "none",
            background: "#9147ff",
            color: "#fff",
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Sign in with Twitch
        </button>
      )}

      {/* OBS Instructions */}
      {token && (
        <div
          style={{
            marginTop: 40,
            padding: "18px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            OBS Setup
          </h2>
          <ol
            style={{
              color: "#aaa",
              fontSize: 14,
              lineHeight: 1.8,
              paddingLeft: 20,
            }}
          >
            <li>Open OBS → Sources → Add → Browser</li>
            <li>
              Set URL to:{" "}
              <code
                style={{
                  background: "rgba(255,255,255,0.08)",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 13,
                  userSelect: "all",
                }}
              >
                {typeof window !== "undefined"
                  ? `${window.location.origin}/overlay`
                  : "/overlay"}
              </code>
            </li>
            <li>
              Set Width to <strong>1920</strong>, Height to{" "}
              <strong>1080</strong>
            </li>
            <li>Check &quot;Shutdown source when not visible&quot;</li>
          </ol>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [clientId, setClientId] = useState("");
  const [inputId, setInputId] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = getClientId();
    setClientId(id);
    setInputId(id);
  }, []);

  if (!mounted) return null;

  // If no client ID configured, show setup
  if (!clientId) {
    return (
      <div
        style={{
          maxWidth: 400,
          margin: "0 auto",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Grover Gang Overlay
        </h1>
        <p style={{ color: "#888", marginBottom: 32 }}>
          Enter your Twitch Application Client ID to get started.
        </p>
        <input
          type="text"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          placeholder="Twitch Client ID"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: 15,
            marginBottom: 16,
            outline: "none",
          }}
        />
        <button
          onClick={() => {
            const trimmed = inputId.trim();
            if (trimmed) {
              localStorage.setItem(CLIENT_ID_KEY, trimmed);
              setClientId(trimmed);
            }
          }}
          disabled={!inputId.trim()}
          style={{
            padding: "12px 28px",
            borderRadius: 6,
            border: "none",
            background: inputId.trim() ? "#9147ff" : "#444",
            color: "#fff",
            cursor: inputId.trim() ? "pointer" : "not-allowed",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Save &amp; Continue
        </button>
      </div>
    );
  }

  return (
    <TwitchProvider
      clientId={clientId}
      scopes={TWITCH_SCOPES}
      subscriptions={TWITCH_SUBSCRIPTIONS}
    >
      <DashboardContent />
    </TwitchProvider>
  );
}
