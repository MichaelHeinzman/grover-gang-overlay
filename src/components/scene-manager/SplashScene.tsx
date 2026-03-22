"use client";

import { motion } from "motion/react";
import { useSceneManager, type SceneName } from "./SceneManagerProvider";
import "./scene-layouts.css";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const accentLineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 0.8,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const letterVariants = {
  hidden: { y: 40, opacity: 0, filter: "blur(8px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const subtitleVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" as const, delay: 0.6 },
  },
};

const countdownVariants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
      delay: 0.5,
    },
  },
};

/** Full-screen centered text scene (Starting Soon, BRB, Ending). */
export function SplashScene({
  sceneName,
  title,
  subtitle,
  countdown,
  accentColor = "var(--rl-blue)",
}: {
  sceneName: SceneName;
  title: string;
  subtitle?: string;
  /** Live countdown string, e.g. "12:34" */
  countdown?: string;
  accentColor?: string;
}) {
  const { displayScene, phase } = useSceneManager();
  const isVisible =
    sceneName === displayScene && (phase === "idle" || phase === "enter-scene");
  const letters = title.split("");

  return (
    <div
      className="rl-splash-scene"
      style={{ "--splash-accent": accentColor } as React.CSSProperties}
    >
      {/* Animated grid floor */}
      <div className="rl-splash-grid" />

      {/* Floating particles */}
      <div className="rl-splash-particles">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="rl-splash-particle"
            style={{ background: accentColor }}
          />
        ))}
      </div>

      {/* Gradient sweep */}
      <div className="rl-splash-sweep" />

      {/* Scanline texture */}
      <div className="rl-splash-scanlines" />

      {/* Vignette */}
      <div className="rl-splash-vignette" />

      <motion.div
        className="rl-splash-content"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {/* Top accent line — expands from center */}
        <motion.div
          className="rl-splash-accent-line"
          style={{ background: accentColor }}
          variants={accentLineVariants}
        />

        {/* Title — letter-by-letter reveal with blur */}
        <h1
          className="rl-splash-title"
          style={{ textShadow: `0 0 30px ${accentColor}` }}
        >
          {letters.map((char, i) => (
            <motion.span
              key={`${i}-${char}`}
              className="rl-splash-letter"
              variants={letterVariants}
              style={{ display: "inline-block" }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </h1>

        {/* Countdown — spring pop-in */}
        {countdown && (
          <motion.div
            className="rl-splash-countdown"
            style={{
              color: accentColor,
              textShadow: `0 0 20px ${accentColor}`,
            }}
            variants={countdownVariants}
          >
            {countdown}
          </motion.div>
        )}

        {/* Subtitle — smooth slide-up fade */}
        {subtitle && (
          <motion.p className="rl-splash-subtitle" variants={subtitleVariants}>
            {subtitle}
          </motion.p>
        )}

        {/* Bottom accent line — expands from center */}
        <motion.div
          className="rl-splash-accent-line"
          style={{ background: accentColor }}
          variants={accentLineVariants}
        />
      </motion.div>

      {/* Ambient glow pulse behind the content */}
      <motion.div
        className="rl-splash-glow"
        style={{ background: accentColor }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={
          isVisible
            ? {
                opacity: [0, 0.15, 0.08, 0.12],
                scale: [0.6, 1.2, 1, 1.1],
              }
            : { opacity: 0, scale: 0.6 }
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
