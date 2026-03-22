"use client";

import "@/styles/rocket-league-theme.css";
import { useEffect, useState } from "react";

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      setScale(s);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

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
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
