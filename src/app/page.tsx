"use client";

import {
  TwitchProvider,
  useTwitchAuth,
  useTwitchConnection,
} from "@four-leaf-studios/twitch-overlay";
import { TWITCH_SCOPES, TWITCH_SUBSCRIPTIONS } from "@/lib/twitch-config";
import { useState, useEffect, useCallback } from "react";

const CLIENT_ID_KEY = "grover_gang_client_id";
const CAMERA_LABEL_KEY = "grover_gang_camera_label";
const ALERT_CHANNEL = "grover-gang-alerts";

interface TestAlert {
  type: string;
  label: string;
  title: string;
  message: string;
  color: string;
  icon: string;
}

const TEST_ALERTS: TestAlert[] = [
  {
    type: "follow",
    label: "Follow",
    title: "New Teammate",
    message: "TestUser joined the squad!",
    color: "#00AAFF",
    icon: "\ud83c\udfce\ufe0f",
  },
  {
    type: "subscribe",
    label: "Sub",
    title: "Ranked Up",
    message: "TestUser subscribed (Tier 1)!",
    color: "#FF8C00",
    icon: "\ud83c\udfc6",
  },
  {
    type: "gift",
    label: "Gift Sub",
    title: "Gift Drop",
    message: "TestUser gifted 5 subs!",
    color: "#00E5FF",
    icon: "\ud83c\udf81",
  },
  {
    type: "cheer",
    label: "Cheer",
    title: "Boost Pad",
    message: "TestUser cheered 500 bits!",
    color: "#FFD700",
    icon: "\u26a1",
  },
  {
    type: "raid",
    label: "Raid",
    title: "Demolition!",
    message: "TestUser raided with 42 viewers!",
    color: "#FF4500",
    icon: "\ud83d\udca5",
  },
  {
    type: "redemption",
    label: "Redeem",
    title: "Item Drop",
    message: 'TestUser redeemed "Hydrate" (500 pts)',
    color: "#00FF88",
    icon: "\ud83c\udfaf",
  },
];

function sendTestAlert(ta: TestAlert) {
  const bc = new BroadcastChannel(ALERT_CHANNEL);
  bc.postMessage({
    type: "test-alert",
    alert: {
      type: ta.type,
      title: ta.title,
      message: ta.message,
      color: ta.color,
      icon: ta.icon,
    },
  });
  bc.close();
}

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
  const [cameraLabel, setCameraLabel] = useState("");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCameraLabel(localStorage.getItem(CAMERA_LABEL_KEY) ?? "");
  }, []);

  const overlayUrl =
    typeof window !== "undefined"
      ? (() => {
          const base = `${window.location.origin}/overlay`;
          const params = new URLSearchParams();
          if (cameraLabel) params.set("cam", cameraLabel);
          if (token?.login) params.set("user", token.login);
          const qs = params.toString();
          return qs ? `${base}?${qs}` : base;
        })()
      : "/overlay";

  const scanCameras = useCallback(async () => {
    setScanning(true);
    setScanError("");
    try {
      // Briefly request camera to get permission (labels need permission)
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      // Immediately release the camera
      tempStream.getTracks().forEach((t) => t.stop());

      // Now enumerate with labels available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setCameras(videoDevices);

      // If stored camera no longer exists, clear it
      if (cameraLabel && !videoDevices.some((d) => d.label === cameraLabel)) {
        setCameraLabel("");
        localStorage.removeItem(CAMERA_LABEL_KEY);
      }
    } catch {
      setScanError("Camera permission denied or no cameras found.");
    } finally {
      setScanning(false);
    }
  }, [cameraLabel]);

  function handleCameraSelect(label: string) {
    setCameraLabel(label);
    if (label) {
      localStorage.setItem(CAMERA_LABEL_KEY, label);
    } else {
      localStorage.removeItem(CAMERA_LABEL_KEY);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "60px 24px",
        color: "#ededed",
      }}
    >
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
              Set URL to the <strong>OBS Browser URL</strong> shown below
            </li>
            <li>
              Set Width to <strong>1920</strong>, Height to{" "}
              <strong>1080</strong>
            </li>
            <li>Check &quot;Shutdown source when not visible&quot;</li>
          </ol>

          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginTop: 16,
              marginBottom: 6,
            }}
          >
            Webcam Setup
          </h3>
          <p style={{ color: "#aaa", fontSize: 13, marginBottom: 10 }}>
            Select your camera below. The dashboard only scans briefly and
            releases the camera immediately — only OBS will hold the stream.
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              onClick={scanCameras}
              disabled={scanning}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                cursor: scanning ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {scanning
                ? "Scanning…"
                : cameras.length
                  ? "Rescan"
                  : "Scan Cameras"}
            </button>
          </div>

          {scanError && (
            <p style={{ color: "#ff4500", fontSize: 13, marginBottom: 8 }}>
              {scanError}
            </p>
          )}

          {cameras.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 13,
                  color: "#888",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                Camera
              </label>
              <select
                value={cameraLabel}
                onChange={(e) => handleCameraSelect(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(30,30,30,0.9)",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="">None (no webcam)</option>
                {cameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.label}>
                    {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: 4 }}>
            <label
              style={{
                fontSize: 13,
                color: "#888",
                display: "block",
                marginBottom: 4,
              }}
            >
              OBS Browser URL {cameraLabel ? `(${cameraLabel})` : "(no webcam)"}
            </label>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <code
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.08)",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  userSelect: "all",
                  wordBreak: "break-all",
                  display: "block",
                }}
              >
                {overlayUrl}
              </code>
              <button
                onClick={handleCopy}
                style={{
                  padding: "10px 16px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: copied
                    ? "rgba(0,229,160,0.15)"
                    : "rgba(255,255,255,0.05)",
                  color: copied ? "#00e5a0" : "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <p
            style={{
              color: "#666",
              fontSize: 12,
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            <strong>Tip:</strong> Add{" "}
            <code
              style={{
                background: "rgba(255,255,255,0.08)",
                padding: "1px 6px",
                borderRadius: 3,
              }}
            >
              --enable-media-stream
            </code>{" "}
            to OBS Browser Source &rarr; Custom CSS... &rarr; Page permissions
            (or OBS launch flags) so OBS can access the camera without a prompt.
          </p>
        </div>
      )}

      {/* Test Alerts */}
      {token && (
        <div
          style={{
            marginTop: 24,
            padding: "18px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            Test Alerts
          </h2>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 14 }}>
            Open your overlay in another Chrome tab, then click a button below.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {TEST_ALERTS.map((ta) => (
              <button
                key={ta.type}
                onClick={() => sendTestAlert(ta)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: `1px solid ${ta.color}44`,
                  background: `${ta.color}15`,
                  color: ta.color,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {ta.label}
              </button>
            ))}
          </div>
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
          color: "#ededed",
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
