"use client";

import { useEffect, useState, useCallback } from "react";

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
 * Maps OBS scene names → overlay layout names.
 *
 * Create these scenes in OBS, then add the SAME browser source
 * to each one using "Add Existing" (not "Add New").
 * The names here must match your OBS scene names exactly.
 */
export const OBS_SCENE_MAP: Record<string, SceneName> = {
  "Starting Soon": "starting-soon",
  Gameplay: "gameplay",
  "Just Chatting": "just-chatting",
  BRB: "brb",
  Ending: "ending",
};

/**
 * Manages the active overlay scene.
 *
 * Primary: listens for OBS `obsSceneChanged` events (works globally, even in-game).
 * Fallback: also listens for keyboard shortcuts (works when browser source has focus).
 */
export function useSceneManager(initialScene: SceneName = "gameplay") {
  const [activeScene, setActiveScene] = useState<SceneName>(initialScene);

  const switchScene = useCallback((scene: SceneName) => {
    setActiveScene(scene);
  }, []);

  useEffect(() => {
    // ── OBS scene change listener (global — works in-game) ──
    function handleObsSceneChanged(event: Event) {
      const detail = (event as CustomEvent<{ name: string }>).detail;
      const sceneName = detail?.name;
      if (sceneName && sceneName in OBS_SCENE_MAP) {
        setActiveScene(OBS_SCENE_MAP[sceneName]);
      }
    }

    // ── Keyboard fallback (only works when browser source has focus) ──
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
        setActiveScene(scene);
      }
    }

    window.addEventListener("obsSceneChanged", handleObsSceneChanged);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("obsSceneChanged", handleObsSceneChanged);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return { activeScene, switchScene };
}
