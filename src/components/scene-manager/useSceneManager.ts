"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { playSceneTransitionSound } from "@/lib/alert-sounds";

/**
 * Available overlay scenes.
 * Add or remove scenes here and they'll be available everywhere.
 */
export type SceneName =
  | "starting-soon"
  | "gameplay"
  | "just-chatting"
  | "brb"
  | "ending";

/**
 * Transition phases:
 *  idle        → no transition running
 *  exit-scene  → old scene content animates out
 *  cover-in    → opaque cover slides in (content already hidden)
 *  covered     → fully hidden, scene swaps here
 *  cover-out   → cover slides out, revealing new scene
 *  enter-scene → new scene content animates in
 */
export type TransitionPhase =
  | "idle"
  | "exit-scene"
  | "cover-in"
  | "covered"
  | "cover-out"
  | "enter-scene";

/**
 * Maps OBS scene names → overlay layout names.
 */
export const OBS_SCENE_MAP: Record<string, SceneName> = {
  "Starting Soon": "starting-soon",
  Gameplay: "gameplay",
  "Just Chatting": "just-chatting",
  BRB: "brb",
  Ending: "ending",
};

/** Timing for each transition phase (ms) */
const EXIT_SCENE_DURATION = 350;
const COVER_IN_DURATION = 400;
const COVERED_DURATION = 120;
const COVER_OUT_DURATION = 400;
const ENTER_SCENE_DURATION = 450;

/**
 * Manages the active overlay scene with animated transitions.
 *
 * Primary: listens for OBS `obsSceneChanged` events (works globally, even in-game).
 * Fallback: also listens for keyboard shortcuts (works when browser source has focus).
 */
export function useSceneManager(initialScene: SceneName = "gameplay") {
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

      // Phase 1: current scene content animates out
      setPhase("exit-scene");

      setTimeout(() => {
        // Phase 2: opaque cover slides in
        setPhase("cover-in");

        setTimeout(() => {
          // Phase 3: fully covered — swap the scene
          setPhase("covered");
          setDisplayScene(scene);

          setTimeout(() => {
            // Phase 4: cover slides out, revealing new scene
            setPhase("cover-out");

            setTimeout(() => {
              // Phase 5: new scene content animates in
              setPhase("enter-scene");

              setTimeout(() => {
                setPhase("idle");
                transitioning.current = false;
              }, ENTER_SCENE_DURATION);
            }, COVER_OUT_DURATION);
          }, COVERED_DURATION);
        }, COVER_IN_DURATION);
      }, EXIT_SCENE_DURATION);
    },
    [activeScene],
  );

  useEffect(() => {
    function handleObsSceneChanged(event: Event) {
      const detail = (event as CustomEvent<{ name: string }>).detail;
      const sceneName = detail?.name;
      if (sceneName && sceneName in OBS_SCENE_MAP) {
        switchScene(OBS_SCENE_MAP[sceneName]);
      }
    }

    const FALLBACK_KEYS: Record<string, SceneName> = {
      "1": "starting-soon",
      "2": "gameplay",
      "3": "just-chatting",
      "4": "brb",
      "5": "ending",
    };

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const scene = FALLBACK_KEYS[e.key];
      if (scene) {
        e.preventDefault();
        switchScene(scene);
      }
    }

    window.addEventListener("obsSceneChanged", handleObsSceneChanged);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("obsSceneChanged", handleObsSceneChanged);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [switchScene]);

  return { activeScene, displayScene, phase, switchScene };
}
