"use client";

import { motion, AnimatePresence } from "motion/react";
import { useSceneManager } from "./SceneManagerProvider";
import "./scene-transition.css";

/** Full-screen cover transition that fully hides content between scenes. */
export function SceneTransition() {
  const { phase } = useSceneManager();
  const showCover =
    phase === "cover-in" || phase === "covered" || phase === "cover-out";

  return (
    <div className="rl-transition">
      <AnimatePresence>
        {showCover && (
          <motion.div
            key="cover"
            className="rl-transition__cover"
            initial={{ x: "-101%" }}
            animate={{ x: "0%" }}
            exit={{ x: "101%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 1,
            }}
          >
            {/* Energy bars on cover surface */}
            <div className="rl-transition__bar rl-transition__bar--1" />
            <div className="rl-transition__bar rl-transition__bar--2" />
            <div className="rl-transition__bar rl-transition__bar--3" />
            <div className="rl-transition__bar rl-transition__bar--4" />
            <div className="rl-transition__bar rl-transition__bar--5" />

            {/* Scanline texture */}
            <div className="rl-transition__scanlines" />

            {/* Center energy flash */}
            {phase === "covered" && (
              <motion.div
                className="rl-transition__flash"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leading edge glow — travels with the cover's leading edge */}
      <AnimatePresence>
        {phase === "cover-in" && (
          <motion.div
            key="edge-in"
            className="rl-transition__edge rl-transition__edge--blue"
            initial={{ x: "-6px" }}
            animate={{ x: "calc(100vw - 3px)" }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 1,
            }}
          />
        )}
        {phase === "cover-out" && (
          <motion.div
            key="edge-out"
            className="rl-transition__edge rl-transition__edge--orange"
            initial={{ x: "-6px" }}
            animate={{ x: "calc(100vw - 3px)" }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 1,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
