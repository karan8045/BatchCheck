"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ErrorBoundary3D } from "./ErrorBoundary3D";

function FloatingTablets() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate a few procedural tablets floating in background
  const tablets = [
    { pos: [-2.2, 1.2, -2], rot: [0.4, 0.2, 0.5], scale: 0.6 },
    { pos: [2.0, -1.0, -1.5], rot: [-0.3, 0.8, -0.2], scale: 0.7 },
    { pos: [-1.5, -1.8, -2.5], rot: [0.1, -0.5, 0.9], scale: 0.5 },
    { pos: [1.8, 1.6, -2.2], rot: [0.6, -0.2, 0.3], scale: 0.55 },
  ];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = state.pointer.x * 0.15 + Math.sin(t * 0.2) * 0.05;
    groupRef.current.rotation.x = -state.pointer.y * 0.15 + Math.cos(t * 0.2) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {tablets.map((item, idx) => (
        <mesh
          key={idx}
          position={item.pos as [number, number, number]}
          rotation={item.rot as [number, number, number]}
          scale={item.scale}
        >
          <capsuleGeometry args={[0.3, 0.6, 8, 12]} />
          <meshStandardMaterial
            color="#38bdf8"
            roughness={0.4}
            metalness={0.6}
            opacity={0.35}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}

export default function AboutScene() {
  return (
    <ErrorBoundary3D status="default">
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <Suspense fallback={null}>
          <Canvas
            camera={{ position: [0, 0, 4], fov: 50 }}
            dpr={[1, 1.2]}
            gl={{ antialias: false, powerPreference: "high-performance" }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 3, 2]} intensity={0.8} />
            <FloatingTablets />
          </Canvas>
        </Suspense>
      </div>
    </ErrorBoundary3D>
  );
}

