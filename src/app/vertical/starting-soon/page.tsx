"use client";

import { OBSProvider } from "@/components/obs-provider/OBSProvider";
import { SceneLayer } from "@/components/scene-manager/SceneLayer";
import { SceneManagerProvider } from "@/components/scene-manager/SceneManagerProvider";
import { SceneTransition } from "@/components/scene-manager/SceneTransition";
import { SplashScene } from "@/components/scene-manager/SplashScene";
import { useCountdown } from "@/components/scene-manager/useCountdown";

const StartingSoonScene = () => {
  const countdown = useCountdown();

  return (
    <SplashScene
      sceneName="starting-soon"
      title="Starting Soon"
      subtitle="Hang tight..."
      countdown={countdown}
      accentColor="var(--rl-blue)"
    />
  );
};

export default function StartingSoonPage() {
  return (
    <OBSProvider>
      <SceneManagerProvider>
        <SceneLayer sceneName="starting-soon">
          <SceneTransition />
          <StartingSoonScene />
        </SceneLayer>
      </SceneManagerProvider>
    </OBSProvider>
  );
}
