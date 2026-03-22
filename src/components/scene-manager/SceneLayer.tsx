"use client";

import { useMemo, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  useSceneManager,
  type SceneName,
  type TransitionPhase,
} from "./SceneManagerProvider";

const CONTENT_SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 22,
  mass: 0.9,
};

function useAnimateTarget(sceneName: SceneName) {
  const { displayScene, phase } = useSceneManager();

  return useMemo(() => {
    const isActive = sceneName === displayScene;

    if (!isActive) {
      return { opacity: 0, scale: 1, filter: "blur(0px) brightness(1)" };
    }

    switch (phase) {
      case "exit-scene":
        return {
          opacity: 0,
          scale: 0.92,
          filter: "blur(10px) brightness(1.6)",
        };
      case "cover-in":
      case "covered":
        return {
          opacity: 0,
          scale: 0.96,
          filter: "blur(6px) brightness(1.3)",
        };
      case "cover-out":
        return {
          opacity: 0.3,
          scale: 0.98,
          filter: "blur(3px) brightness(1.15)",
        };
      case "enter-scene":
      case "idle":
      default:
        return { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" };
    }
  }, [sceneName, displayScene, phase]);
}

export function SceneLayer({
  sceneName,
  children,
}: {
  sceneName: SceneName;
  children: ReactNode;
}) {
  const { displayScene } = useSceneManager();
  const animateTarget = useAnimateTarget(sceneName);
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
