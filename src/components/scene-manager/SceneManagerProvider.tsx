"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { playSceneTransitionSound } from "@/lib/alert-sounds";
import { useOBSWebSocket } from "@/hooks/useOBSWebSocket";

// ── Types ──

export type SceneName =
  | "starting-soon"
  | "gameplay"
  | "just-chatting"
  | "brb"
  | "ending";

export type TransitionPhase =
  | "idle"
  | "exit-scene"
  | "cover-in"
  | "covered"
  | "cover-out"
  | "enter-scene";

// ── Constants ──

const OBS_SCENE_MAP: Record<string, SceneName> = {
  "Starting Soon": "starting-soon",
  Gameplay: "gameplay",
  "Just Chatting": "just-chatting",
  BRB: "brb",
  Ending: "ending",
};

const COVER_IN_DURATION = 400;
const COVERED_DURATION = 120;
const COVER_OUT_DURATION = 400;
const ENTER_SCENE_DURATION = 450;

const FALLBACK_KEYS: Record<string, SceneName> = {
  "1": "starting-soon",
  "2": "gameplay",
  "3": "just-chatting",
  "4": "brb",
  "5": "ending",
};

// ── Context ──

interface SceneManagerContextValue {
  activeScene: SceneName;
  displayScene: SceneName;
  phase: TransitionPhase;
  switchScene: (scene: SceneName) => void;
}

const SceneManagerContext = createContext<SceneManagerContextValue | null>(
  null,
);

export function useSceneManager(): SceneManagerContextValue {
  const ctx = useContext(SceneManagerContext);
  if (!ctx) {
    throw new Error(
      "useSceneManager must be used within <SceneManagerProvider>",
    );
  }
  return ctx;
}

// ── Provider ──

export function SceneManagerProvider({
  initialScene = "gameplay",
  children,
}: {
  initialScene?: SceneName;
  children: ReactNode;
}) {
  const [activeScene, setActiveScene] = useState<SceneName>(initialScene);
  const [displayScene, setDisplayScene] = useState<SceneName>(initialScene);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const transitioning = useRef(false);

  const switchScene = useCallback(
    (scene: SceneName) => {
      if (scene === activeScene || transitioning.current) return;
      transitioning.current = true;

      setActiveScene(scene);
      playSceneTransitionSound();

      setPhase("cover-in");

      setTimeout(() => {
        setPhase("covered");
        setDisplayScene(scene);

        setTimeout(() => {
          setPhase("cover-out");
          document.body.style.setProperty(
            "background",
            "transparent",
            "important",
          );

          setTimeout(() => {
            setPhase("enter-scene");

            setTimeout(() => {
              setPhase("idle");
              transitioning.current = false;
            }, ENTER_SCENE_DURATION);
          }, COVER_OUT_DURATION);
        }, COVERED_DURATION);
      }, COVER_IN_DURATION);
    },
    [activeScene],
  );

  // Stable ref for OBS callbacks
  const switchRef = useRef(switchScene);
  useEffect(() => {
    switchRef.current = switchScene;
  }, [switchScene]);

  // OBS WebSocket — single source of truth for scene changes
  useOBSWebSocket({
    onSceneTransitionStarted() {
      document.body.style.setProperty("background", "#000", "important");
    },
    onSceneChanged(sceneName) {
      if (sceneName in OBS_SCENE_MAP) {
        switchRef.current(OBS_SCENE_MAP[sceneName]);
      }
    },
  });

  // Keyboard fallback
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const scene = FALLBACK_KEYS[e.key];
      if (scene) {
        e.preventDefault();
        switchRef.current(scene);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SceneManagerContext.Provider
      value={{ activeScene, displayScene, phase, switchScene }}
    >
      {children}
    </SceneManagerContext.Provider>
  );
}
