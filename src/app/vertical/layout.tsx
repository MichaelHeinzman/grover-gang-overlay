"use client";

import "@/styles/rocket-league-theme.css";
import { useEffect, useState } from "react";

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseWidth = 1080;
  const baseHeight = 1920;
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const s = Math.min(
        window.innerWidth / baseWidth,
        window.innerHeight / baseHeight,
      );
      setScale(s);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [baseHeight, baseWidth]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <style>{`html, body { margin: 0; padding: 0; background: transparent !important; overflow: hidden; }`}</style>
      <div
        className="rl-overlay-root"
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
