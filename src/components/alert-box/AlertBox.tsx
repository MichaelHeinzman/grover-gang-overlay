"use client";

import type { AlertItem } from "../use-alert-queue/useAlertQueue";
import "./alert-box.css";

export function AlertBox({ alert }: { alert: AlertItem }) {
  const cls = `rl-alert ${alert.exiting ? "rl-alert--exiting" : "rl-alert--entering"}`;

  return (
    <div
      className={cls}
      style={{ "--_alert-color": alert.color } as React.CSSProperties}
    >
      <div className="rl-alert__accent-top" />
      <div className="rl-alert__scanline" />

      <span className="rl-alert__icon">{alert.icon}</span>

      <div className="rl-alert__body">
        <div className="rl-alert__title">{alert.title}</div>
        <div className="rl-alert__message">{alert.message}</div>
      </div>
    </div>
  );
}
