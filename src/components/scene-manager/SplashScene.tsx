"use client";

import "./scene-layouts.css";

/** Full-screen centered text scene (Starting Soon, BRB, Ending). */
export function SplashScene({
  title,
  subtitle,
  countdown,
  accentColor = "var(--rl-blue)",
}: {
  title: string;
  subtitle?: string;
  /** Live countdown string, e.g. "12:34" */
  countdown?: string;
  accentColor?: string;
}) {
  return (
    <div className="rl-splash-scene">
      <div className="rl-splash-content">
        <div
          className="rl-splash-accent-line"
          style={{ background: accentColor }}
        />
        <h1
          className="rl-splash-title"
          style={{ textShadow: `0 0 30px ${accentColor}` }}
        >
          {title}
        </h1>
        {countdown && (
          <div
            className="rl-splash-countdown"
            style={{
              color: accentColor,
              textShadow: `0 0 20px ${accentColor}`,
            }}
          >
            {countdown}
          </div>
        )}
        {subtitle && <p className="rl-splash-subtitle">{subtitle}</p>}
        <div
          className="rl-splash-accent-line"
          style={{ background: accentColor }}
        />
      </div>
    </div>
  );
}
