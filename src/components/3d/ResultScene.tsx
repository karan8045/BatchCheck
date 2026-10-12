"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { BlisterStrip } from "./BlisterStrip";
import { ErrorBoundary3D } from "./ErrorBoundary3D";
import { Static2DFallback } from "./Static2DFallback";

interface ResultSceneProps {
  status: "flagged" | "expired" | "no_match";
}

export default function ResultScene({ status }: ResultSceneProps) {
  const [isTabVisible, setIsTabVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <ErrorBoundary3D status={status}>
      <div className="relative w-full h-56 sm:h-64 flex items-center justify-center overflow-hidden my-2">
        <Suspense fallback={<Static2DFallback status={status} />}>
          <Canvas
            camera={{ position: [0, 0, 4.8], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ antialias: false, powerPreference: "high-performance" }}
            frameloop={isTabVisible ? "always" : "never"}
            className="w-full h-full"
          >
            <ambientLight intensity={status === "expired" ? 0.6 : 0.9} />
            <directionalLight
              position={[3, 5, 4]}
              intensity={status === "flagged" ? 1.5 : 1.2}
              color={status === "flagged" ? "#fca5a5" : "#ffffff"}
            />
            <directionalLight position={[-3, -3, 2]} intensity={0.3} color="#60a5fa" />

            <BlisterStrip status={status} isScanning={false} />
          </Canvas>
        </Suspense>
      </div>
    </ErrorBoundary3D>
  );
}

