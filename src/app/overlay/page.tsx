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
import {
  useSceneManager,
  type SceneName,
  type TransitionPhase,
} from "@/components/scene-manager/useSceneManager";
import { SplashScene } from "@/components/scene-manager/SplashScene";
import { SceneTransition } from "@/components/scene-manager/SceneTransition";
import { useCountdown } from "@/components/scene-manager/useCountdown";
import { motion } from "motion/react";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const CLIENT_ID_KEY = "grover_gang_client_id";

/** Spring config shared between scene content and cover for blended feel */
const CONTENT_SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 22,
  mass: 0.9,
};

/**
 * Compute the motion animate target for a scene layer based on phase.
 * The motion.div stays mounted — only its animated properties change,
 * so React never remounts children (no flicker).
 */
function useSceneAnimateTarget(
  sceneName: SceneName,
  displayScene: SceneName,
  phase: TransitionPhase,
) {
  return useMemo(() => {
    const isActive = sceneName === displayScene;

    // Scene is not the one being shown — keep it invisible
    if (!isActive) {
      return { opacity: 0, scale: 1, filter: "blur(0px) brightness(1)" };
    }

    // Active scene — animate based on transition phase
    switch (phase) {
      case "exit-scene":
        // Old scene dissolves out: shrinks, brightens, blurs
        return {
          opacity: 0,
          scale: 0.92,
          filter: "blur(10px) brightness(1.6)",
        };
      case "cover-in":
      case "covered":
        // Scene hidden behind opaque cover — keep collapsed so reveal is clean
        return { opacity: 0, scale: 0.96, filter: "blur(6px) brightness(1.3)" };
      case "cover-out":
        // Cover sliding away — scene starts faded, will spring to life
        return {
          opacity: 0.3,
          scale: 0.98,
          filter: "blur(3px) brightness(1.15)",
        };
      case "enter-scene":
        // New scene springs in
        return { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" };
      case "idle":
      default:
        return { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" };
    }
  }, [sceneName, displayScene, phase]);
}

function SceneLayer({
  sceneName,
  displayScene,
  phase,
  children,
}: {
  sceneName: SceneName;
  displayScene: SceneName;
  phase: TransitionPhase;
  children: React.ReactNode;
}) {
  const animateTarget = useSceneAnimateTarget(sceneName, displayScene, phase);
  const isActive = sceneName === displayScene;

  return (
    <div
      className={`rl-scene-layer${isActive ? " active" : ""}`}
      style={{ pointerEvents: isActive ? "auto" : "none" }}
    >
      <motion.div
        className="rl-scene-content"
        animate={animateTarget}
        initial={false}
        transition={CONTENT_SPRING}
      >
        {children}
      </motion.div>
    </div>
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
  const { activeScene, displayScene, phase } = useSceneManager();
  const countdown = useCountdown();

  const layerProps = { displayScene, phase };

  return (
    <TwitchOverlay>
      {/* Alert listeners run in all scenes */}
      <AlertListeners push={push} />

      {/* ── Transition overlay ── */}
      <SceneTransition phase={phase} />

      {/* ── Scene 1: Starting Soon ── */}
      <SceneLayer sceneName="starting-soon" {...layerProps}>
        <SplashScene
          title="Starting Soon"
          subtitle="Hang tight..."
          countdown={countdown}
          accentColor="var(--rl-blue)"
        />
      </SceneLayer>

      {/* ── Scene 2: Gameplay (default) ── */}
      <SceneLayer sceneName="gameplay" {...layerProps}>
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
      <SceneLayer sceneName="just-chatting" {...layerProps}>
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
      <SceneLayer sceneName="brb" {...layerProps}>
        <SplashScene title="Be Right Back" accentColor="var(--rl-orange)" />
      </SceneLayer>

      {/* ── Scene 5: Ending ── */}
      <SceneLayer sceneName="ending" {...layerProps}>
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
