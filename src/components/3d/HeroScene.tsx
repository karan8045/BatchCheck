"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { BlisterStrip } from "./BlisterStrip";
import { ErrorBoundary3D } from "./ErrorBoundary3D";
import { Static2DFallback } from "./Static2DFallback";

interface HeroSceneProps {
  isScanning?: boolean;
}

export default function HeroScene({ isScanning = false }: HeroSceneProps) {
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
    <ErrorBoundary3D status="default" isScanning={isScanning}>
      <div className="relative w-full h-64 sm:h-72 flex items-center justify-center overflow-hidden">
        <Suspense fallback={<Static2DFallback status="default" isScanning={isScanning} />}>
          <Canvas
            camera={{ position: [0, 0, 5], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{ antialias: false, powerPreference: "high-performance" }}
            frameloop={isTabVisible ? "always" : "never"}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            {/* Soft lighting setup: 1 ambient + 1 key directional + 1 subtle fill */}
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 5, 4]} intensity={1.3} />
            <directionalLight position={[-3, -3, 2]} intensity={0.4} color="#60a5fa" />

            {/* Subtle depth floor reflection/grid */}
            <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10, 10]} />
              <meshBasicMaterial color="#080e1e" />
            </mesh>

            {/* 3D Blister Strip */}
            <BlisterStrip status="default" isScanning={isScanning} />
          </Canvas>
        </Suspense>
      </div>
    </ErrorBoundary3D>
  );
}

