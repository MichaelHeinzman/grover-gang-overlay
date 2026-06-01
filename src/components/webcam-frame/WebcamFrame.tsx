"use client";

import { useEffect, useRef } from "react";
import "./webcam-frame.css";

export function WebcamFrame({
  cameraLabel,
  username,
}: {
  cameraLabel?: string;
  username?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!cameraLabel) return;

    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startCamera() {
      try {
        // Enumerate devices to find one matching the label
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        const match = videoDevices.find((d) => d.label === cameraLabel);

        if (cancelled) return;

        const constraints: MediaStreamConstraints = {
          video: match ? { deviceId: { exact: match.deviceId } } : true,
          audio: false,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraLabel]);

  if (!cameraLabel) {
    return null;
  }

  return (
    <div className="rl-webcam">
      {/* Outer frame with clipped corners */}
      <div className="rl-webcam__frame">
        <div className="rl-webcam__inner">
          <video
            ref={videoRef}
            className="rl-webcam__video"
            autoPlay
            muted
            playsInline
          />
        </div>
      </div>

      {/* Accent lines */}
      <div className="rl-webcam__accent-top" />
      <div className="rl-webcam__accent-bottom" />
      <div className="rl-webcam__accent-left" />
      <div className="rl-webcam__accent-right" />

      {/* Scanline overlay */}
      <div className="rl-webcam__scanline" />

      {/* Username tag — integrated into webcam frame */}
      {username && (
        <div className="rl-webcam__username-bar">
          <div className="rl-webcam__username-accent-left" />
          <div className="rl-webcam__username-glow" />
          <span className="rl-webcam__username-text">
            {username.toUpperCase()}
          </span>
          <div className="rl-webcam__username-accent-right" />
          <div className="rl-webcam__username-scanline" />
        </div>
      )}
    </div>
  );
}
