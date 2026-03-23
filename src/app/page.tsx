"use client";

import {
  TwitchProvider,
  useTwitchAuth,
  useTwitchConnection,
} from "@four-leaf-studios/twitch-overlay";
import { TWITCH_SCOPES, TWITCH_SUBSCRIPTIONS } from "@/lib/twitch-config";
import {
  setStreamStartTime,
  clearStreamStartTime,
} from "@/components/scene-manager/useCountdown";
import { useState, useEffect, useCallback, useRef } from "react";
import { STORAGE_KEYS, OBS_DEFAULTS } from "@/lib/storage-keys";
import { OBSProvider, useOBS } from "@/components/obs-provider/OBSProvider";
import { Accordion } from "@/components/accordion/Accordion";

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
    icon: "🏎️",
  },
  {
    type: "subscribe",
    label: "Sub",
    title: "Ranked Up",
    message: "TestUser subscribed (Tier 1)!",
    color: "#FF8C00",
    icon: "🏆",
  },
  {
    type: "resub",
    label: "Resub",
    title: "Resub!",
    message: 'TestUser resubbed for 12 months (Tier 1)! "Love this stream!"',
    color: "#FF8C00",
    icon: "🔄",
  },
  {
    type: "gift",
    label: "Gift Sub",
    title: "Gift Drop",
    message: "TestUser gifted 5 subs!",
    color: "#00E5FF",
    icon: "🎁",
  },
  {
    type: "cheer",
    label: "Cheer",
    title: "Boost Pad",
    message: "TestUser cheered 500 bits!",
    color: "#FFD700",
    icon: "⚡",
  },
  {
    type: "raid",
    label: "Raid",
    title: "Demolition!",
    message: "TestUser raided with 42 viewers!",
    color: "#FF4500",
    icon: "💥",
  },
  {
    type: "redemption",
    label: "Redeem",
    title: "Item Drop",
    message: 'TestUser redeemed "Hydrate" (500 pts)',
    color: "#00FF88",
    icon: "🎯",
  },
  {
    type: "shoutout",
    label: "Shoutout",
    title: "Shoutout!",
    message: "Shouting out CoolStreamer! Go check them out!",
    color: "#A855F7",
    icon: "📣",
  },
  {
    type: "hype-train",
    label: "Hype Train",
    title: "Hype Train!",
    message: "The hype train has started! All aboard!",
    color: "#FF6B6B",
    icon: "🚂",
  },
  {
    type: "charity",
    label: "Charity",
    title: "Charity Donation!",
    message: "TestUser donated $25.00 USD to charity!",
    color: "#FF69B4",
    icon: "💝",
  },
  {
    type: "mod",
    label: "Mod",
    title: "New Moderator!",
    message: "TestUser has been modded! 🗡️",
    color: "#00B894",
    icon: "🛡️",
  },
  {
    type: "info",
    label: "Info",
    title: "Channel Updated",
    message: "Now playing Rocket League — Ranked Grind",
    color: "#74B9FF",
    icon: "📝",
  },
  {
    type: "chat",
    label: "Chat",
    title: "",
    message: "This is a test chat message! 🚀",
    color: "#EDEDED",
    icon: "💬",
  },
];

function sendTestAlert(
  ta: TestAlert,
  broadcast: (data: Record<string, unknown>) => void,
) {
  if (ta.type === "chat") {
    broadcast({
      type: "grover-gang-chat",
      user: "TestUser",
      color: "#00AAFF",
      message: ta.message,
    });
    return;
  }
  broadcast({
    type: "grover-gang-alert",
    alert: {
      type: ta.type,
      title: ta.title,
      message: ta.message,
      color: ta.color,
      icon: ta.icon,
    },
  });
}

function getClientId(): string {
  if (typeof window === "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ??
    localStorage.getItem(STORAGE_KEYS.CLIENT_ID) ??
    ""
  );
}

function DashboardContent() {
  const { token, loading, login, logout } = useTwitchAuth();
  const connection = useTwitchConnection();
  const { broadcast, connected: obsConnected } = useOBS();
  const [cameraLabel, setCameraLabel] = useState("");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [copied, setCopied] = useState(false);
  const [obsPassword, setObsPassword] = useState("");
  const [obsIp, setObsIp] = useState<string>(OBS_DEFAULTS.IP);
  const [obsPort, setObsPort] = useState<string>(OBS_DEFAULTS.PORT);
  const [obsSettingsSaved, setObsSettingsSaved] = useState(false);
  const [obsTunnelUrl, setObsTunnelUrl] = useState("");
  const [startHour, setStartHour] = useState("7");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"PM" | "AM">("PM");
  const [startTimeSet, setStartTimeSet] = useState(false);
  const [configSynced, setConfigSynced] = useState(false);

  // Ref to hold latest config values for auto-broadcast
  const configRef = useRef({ clientId: "", cameraLabel: "", username: "" });

  // Keep configRef up to date
  useEffect(() => {
    configRef.current = {
      clientId:
        process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ??
        localStorage.getItem(STORAGE_KEYS.CLIENT_ID) ??
        "",
      cameraLabel,
      username: token?.login ?? "",
    };
  }, [cameraLabel, token?.login]);

  /** Broadcast overlay config to all OBS-connected clients */
  const broadcastConfig = useCallback(() => {
    broadcast({
      type: "grover-gang-config",
      ...configRef.current,
    });
    setConfigSynced(true);
    setTimeout(() => setConfigSynced(false), 2000);
    console.log("[Dashboard] Broadcast config via OBS");
  }, [broadcast]);

  // Auto-broadcast config when OBS connects
  const prevConnected = useRef(false);
  useEffect(() => {
    if (obsConnected && !prevConnected.current) {
      // Small delay to ensure connection is fully established
      const timer = setTimeout(broadcastConfig, 500);
      prevConnected.current = true;
      return () => clearTimeout(timer);
    }
    if (!obsConnected) prevConnected.current = false;
  }, [obsConnected, broadcastConfig]);

  useEffect(() => {
    setCameraLabel(localStorage.getItem(STORAGE_KEYS.CAMERA_LABEL) ?? "");
    setObsPassword(localStorage.getItem(STORAGE_KEYS.OBS_WS_PASSWORD) ?? "");
    setObsIp(localStorage.getItem(STORAGE_KEYS.OBS_WS_IP) ?? OBS_DEFAULTS.IP);
    setObsPort(
      localStorage.getItem(STORAGE_KEYS.OBS_WS_PORT) ?? OBS_DEFAULTS.PORT,
    );
    setObsTunnelUrl(localStorage.getItem(STORAGE_KEYS.OBS_WS_TUNNEL_URL) ?? "");
    if (
      localStorage.getItem(STORAGE_KEYS.OBS_WS_IP) ||
      localStorage.getItem(STORAGE_KEYS.OBS_WS_PASSWORD)
    )
      setObsSettingsSaved(true);
    // Load any previously saved start time
    const saved = localStorage.getItem(STORAGE_KEYS.STREAM_START) ?? "";
    if (saved) {
      const d = new Date(saved);
      if (!isNaN(d.getTime())) {
        const h = d.getHours();
        setStartHour(String(h === 0 ? 12 : h > 12 ? h - 12 : h));
        setStartMinute(String(d.getMinutes()).padStart(2, "0"));
        setStartPeriod(h >= 12 ? "PM" : "AM");
        setStartTimeSet(true);
      }
    }
  }, []);

  const overlayUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/overlay`
      : "/overlay";

  const scanCameras = useCallback(async () => {
    setScanning(true);
    setScanError("");
    try {
      // Try enumerating first — labels are available if permission was previously granted
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = devices.filter((d) => d.kind === "videoinput");

      // If labels are empty, we need to request permission via getUserMedia
      if (videoDevices.length === 0 || !videoDevices[0].label) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          tempStream.getTracks().forEach((t) => t.stop());
        } catch {
          // Camera may be in use by OBS — still try to enumerate
        }
        devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter((d) => d.kind === "videoinput");
      }

      if (videoDevices.length === 0) {
        setScanError("No cameras found.");
        return;
      }

      setCameras(videoDevices);

      // If stored camera no longer exists, clear it
      if (cameraLabel && !videoDevices.some((d) => d.label === cameraLabel)) {
        setCameraLabel("");
        localStorage.removeItem(STORAGE_KEYS.CAMERA_LABEL);
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
      localStorage.setItem(STORAGE_KEYS.CAMERA_LABEL, label);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CAMERA_LABEL);
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
          Twitch
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
        <div
          style={{
            fontSize: 13,
            color: "#888",
            marginBottom: 4,
            marginTop: 10,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          OBS WebSocket
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: obsConnected ? "#00e5a0" : "#ff4500",
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 600 }}>
            {obsConnected ? "Connected" : "Disconnected"}
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

      {/* Stream Countdown */}
      {token && (
        <Accordion id="countdown" title="Stream Countdown">
          <p style={{ color: "#888", fontSize: 13, marginBottom: 14 }}>
            Set a start time for the &quot;Starting Soon&quot; countdown.
            Updates the overlay in real-time.
          </p>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={startHour}
              onChange={(e) => {
                setStartHour(e.target.value);
                setStartTimeSet(false);
              }}
              style={{
                padding: "10px 8px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(30,30,30,0.9)",
                color: "#fff",
                fontSize: 14,
                outline: "none",
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={String(h)}>
                  {h}
                </option>
              ))}
            </select>
            <span style={{ color: "#888", fontSize: 18, fontWeight: 700 }}>
              :
            </span>
            <select
              value={startMinute}
              onChange={(e) => {
                setStartMinute(e.target.value);
                setStartTimeSet(false);
              }}
              style={{
                padding: "10px 8px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(30,30,30,0.9)",
                color: "#fff",
                fontSize: 14,
                outline: "none",
              }}
            >
              {[
                "00",
                "05",
                "10",
                "15",
                "20",
                "25",
                "30",
                "35",
                "40",
                "45",
                "50",
                "55",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={startPeriod}
              onChange={(e) => {
                setStartPeriod(e.target.value as "AM" | "PM");
                setStartTimeSet(false);
              }}
              style={{
                padding: "10px 8px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(30,30,30,0.9)",
                color: "#fff",
                fontSize: 14,
                outline: "none",
              }}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            <button
              onClick={() => {
                let h = parseInt(startHour, 10);
                if (startPeriod === "PM" && h !== 12) h += 12;
                if (startPeriod === "AM" && h === 12) h = 0;
                const now = new Date();
                const target = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate(),
                  h,
                  parseInt(startMinute, 10),
                  0,
                );
                // If the time already passed today, assume tomorrow
                if (target.getTime() <= Date.now()) {
                  target.setDate(target.getDate() + 1);
                }
                setStreamStartTime(target.toISOString());
                setStartTimeSet(true);
              }}
              disabled={startTimeSet}
              style={{
                padding: "10px 16px",
                borderRadius: 6,
                border: "none",
                background: startTimeSet ? "rgba(0,229,160,0.15)" : "#00aaff",
                color: startTimeSet ? "#00e5a0" : "#fff",
                cursor: startTimeSet ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {startTimeSet ? "Set!" : "Set Time"}
            </button>
            <button
              onClick={() => {
                clearStreamStartTime();
                setStartHour("7");
                setStartMinute("00");
                setStartPeriod("PM");
                setStartTimeSet(false);
              }}
              style={{
                padding: "10px 16px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#ff4500",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Clear
            </button>
          </div>
        </Accordion>
      )}

      {/* OBS Setup */}
      {token && (
        <Accordion id="obs-setup" title="OBS Setup">
          {/* OBS WebSocket Settings */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 13,
                color: "#888",
                display: "block",
                marginBottom: 4,
              }}
            >
              OBS WebSocket Connection
            </label>
            <p
              style={{
                color: "#666",
                fontSize: 12,
                marginBottom: 8,
                lineHeight: 1.5,
              }}
            >
              Found in OBS &rarr; Tools &rarr; WebSocket Server Settings.
            </p>
            <div style={{ marginBottom: 10 }}>
              <label
                style={{
                  fontSize: 11,
                  color: "#666",
                  display: "block",
                  marginBottom: 2,
                }}
              >
                Cloudflare Tunnel URL{" "}
                <span style={{ color: "#444" }}>(for HTTPS / Vercel)</span>
              </label>
              <input
                type="text"
                value={obsTunnelUrl}
                onChange={(e) => {
                  setObsTunnelUrl(e.target.value);
                  setObsSettingsSaved(false);
                }}
                placeholder="e.g. https://obs-ws.your-tunnel.trycloudflare.com"
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
              />
              <p
                style={{
                  color: "#555",
                  fontSize: 11,
                  marginTop: 4,
                  lineHeight: 1.4,
                }}
              >
                Run{" "}
                <code
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}
                >
                  cloudflared tunnel --url http://localhost:4455
                </code>{" "}
                and paste the URL here. Required when serving the overlay over
                HTTPS.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "stretch",
                marginBottom: 8,
              }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: "#666",
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  IP Address
                </label>
                <input
                  type="text"
                  value={obsIp}
                  onChange={(e) => {
                    setObsIp(e.target.value);
                    setObsSettingsSaved(false);
                  }}
                  placeholder="192.168.1.248"
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
                />
              </div>
              <div style={{ width: 80 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: "#666",
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  Port
                </label>
                <input
                  type="text"
                  value={obsPort}
                  onChange={(e) => {
                    setObsPort(e.target.value);
                    setObsSettingsSaved(false);
                  }}
                  placeholder="4455"
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
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <input
                type="password"
                value={obsPassword}
                onChange={(e) => {
                  setObsPassword(e.target.value);
                  setObsSettingsSaved(false);
                }}
                placeholder="WebSocket password (optional)"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(30,30,30,0.9)",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                onClick={() => {
                  localStorage.setItem(
                    STORAGE_KEYS.OBS_WS_IP,
                    obsIp || OBS_DEFAULTS.IP,
                  );
                  localStorage.setItem(
                    STORAGE_KEYS.OBS_WS_PORT,
                    obsPort || OBS_DEFAULTS.PORT,
                  );
                  if (obsTunnelUrl.trim()) {
                    localStorage.setItem(
                      STORAGE_KEYS.OBS_WS_TUNNEL_URL,
                      obsTunnelUrl.trim(),
                    );
                  } else {
                    localStorage.removeItem(STORAGE_KEYS.OBS_WS_TUNNEL_URL);
                  }
                  if (obsPassword) {
                    localStorage.setItem(
                      STORAGE_KEYS.OBS_WS_PASSWORD,
                      obsPassword,
                    );
                  } else {
                    localStorage.removeItem(STORAGE_KEYS.OBS_WS_PASSWORD);
                  }
                  setObsSettingsSaved(true);
                }}
                disabled={obsSettingsSaved}
                style={{
                  padding: "10px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: obsSettingsSaved
                    ? "rgba(0,229,160,0.15)"
                    : "#00aaff",
                  color: obsSettingsSaved ? "#00e5a0" : "#fff",
                  cursor: obsSettingsSaved ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {obsSettingsSaved ? "Saved!" : "Save"}
              </button>
            </div>
          </div>
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

          {/* Sync config via OBS */}
          <div
            style={{
              marginTop: 16,
              padding: "14px 18px",
              borderRadius: 8,
              background: obsConnected
                ? "rgba(0,229,160,0.05)"
                : "rgba(255,69,0,0.05)",
              border: `1px solid ${
                obsConnected ? "rgba(0,229,160,0.2)" : "rgba(255,69,0,0.2)"
              }`,
            }}
          >
            <p
              style={{
                color: "#aaa",
                fontSize: 13,
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              Config (camera, username, client ID) is sent to the overlay
              automatically via OBS WebSocket. Click below to re-sync.
            </p>
            <button
              onClick={broadcastConfig}
              disabled={!obsConnected}
              style={{
                padding: "10px 20px",
                borderRadius: 6,
                border: "none",
                background: configSynced
                  ? "rgba(0,229,160,0.15)"
                  : obsConnected
                    ? "#00aaff"
                    : "#444",
                color: configSynced
                  ? "#00e5a0"
                  : obsConnected
                    ? "#fff"
                    : "#888",
                cursor: obsConnected ? "pointer" : "not-allowed",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {configSynced
                ? "Synced!"
                : obsConnected
                  ? "Sync Config to Overlay"
                  : "OBS Not Connected"}
            </button>
          </div>
        </Accordion>
      )}

      {/* Test Alerts */}
      {token && (
        <Accordion id="test-alerts" title="Test Alerts">
          <p style={{ color: "#888", fontSize: 13, marginBottom: 14 }}>
            Sends test alerts to the overlay via OBS WebSocket.
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
                onClick={() => sendTestAlert(ta, broadcast)}
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
        </Accordion>
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
              localStorage.setItem(STORAGE_KEYS.CLIENT_ID, trimmed);
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
    <OBSProvider>
      <TwitchProvider
        clientId={clientId}
        scopes={TWITCH_SCOPES}
        subscriptions={TWITCH_SUBSCRIPTIONS}
      >
        <DashboardContent />
      </TwitchProvider>
    </OBSProvider>
  );
}
