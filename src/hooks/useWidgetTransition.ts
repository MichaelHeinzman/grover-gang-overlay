"use client";

import {
  useSceneManager,
  type SceneName,
} from "@/components/scene-manager/SceneManagerProvider";

export type WidgetDirection = "left" | "right" | "up" | "down" | "scale";

interface WidgetTransitionOptions {
  delay?: number;
  hideOnScenes?: SceneName[];
}

const HIDDEN: Record<WidgetDirection, Record<string, number | string>> = {
  left: { opacity: 0, x: -60, filter: "blur(4px)" },
  right: { opacity: 0, x: 60, filter: "blur(4px)" },
  up: { opacity: 0, y: -60, filter: "blur(4px)" },
  down: { opacity: 0, y: 60, filter: "blur(4px)" },
  scale: { opacity: 0, scale: 0.8, filter: "blur(6px)" },
};

const VISIBLE = { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" };

export function useWidgetTransition(
  direction: WidgetDirection = "right",
  { delay = 0, hideOnScenes }: WidgetTransitionOptions = {},
) {
  const { phase, displayScene } = useSceneManager();

  const sceneHidden = hideOnScenes?.includes(displayScene) ?? false;
  const isVisible =
    (phase === "idle" || phase === "enter-scene") && !sceneHidden;

  return {
    initial: false as const,
    animate: isVisible ? VISIBLE : HIDDEN[direction],
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: isVisible ? delay : 0,
    },
  };
}
