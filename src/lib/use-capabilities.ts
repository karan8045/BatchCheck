"use client";

import { useState, useEffect } from "react";

export function use3DCapabilities() {
  const [isLiteMode, setIsLiteMode] = useState<boolean>(false);
  const [canRun3D, setCanRun3D] = useState<boolean>(true);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);

    // 1. Check user's stored preference
    try {
      const storedLite = localStorage.getItem("batchcheck_litemode");
      if (storedLite === "true") {
        setIsLiteMode(true);
      }
    } catch {
      // localStorage may be disabled
    }

    // 2. Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia) {
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (motionQuery.matches) {
        setCanRun3D(false);
        return;
      }
    }

    // 3. Check low-end device constraints (navigator.deviceMemory <= 2 or hardwareConcurrency <= 4)
    if (typeof navigator !== "undefined") {
      const nav = navigator as any;
      if (nav.deviceMemory && nav.deviceMemory <= 2) {
        setCanRun3D(false);
        return;
      }
      if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) {
        setCanRun3D(false);
        return;
      }
    }

    // 4. Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setCanRun3D(false);
        return;
      }
    } catch {
      setCanRun3D(false);
      return;
    }

    setCanRun3D(true);
  }, []);

  const toggleLiteMode = () => {
    setIsLiteMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("batchcheck_litemode", next ? "true" : "false");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const is3DEnabled = isMounted && canRun3D && !isLiteMode;

  return {
    is3DEnabled,
    isLiteMode,
    canRun3D,
    toggleLiteMode,
    isMounted,
  };
}

