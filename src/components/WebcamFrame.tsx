"use client";

export function WebcamFrame() {
  return (
    <div className="rl-webcam">
      {/* Outer frame with clipped corners */}
      <div className="rl-webcam__frame">
        {/* Inner cutout — transparent so OBS camera shows through */}
        <div className="rl-webcam__inner" />
      </div>

      {/* Accent lines */}
      <div className="rl-webcam__accent-top" />
      <div className="rl-webcam__accent-bottom" />
      <div className="rl-webcam__accent-left" />
      <div className="rl-webcam__accent-right" />

      {/* Scanline overlay */}
      <div className="rl-webcam__scanline" />

      {/* Label */}
      <div className="rl-webcam__label">&#9670; Player Cam</div>
    </div>
  );
}
