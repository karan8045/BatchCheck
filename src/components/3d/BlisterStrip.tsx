"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

export interface BlisterStripProps {
  status?: "default" | "flagged" | "expired" | "no_match";
  isScanning?: boolean;
}

export function BlisterStrip({
  status = "default",
  isScanning = false,
}: BlisterStripProps) {
  const groupRef = useRef<THREE.Group>(null);
  const scanBarRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const clockRef = useRef<THREE.Mesh>(null);

  // Time tracking for single shake on flagged
  const shakeTimer = useRef<number>(0);
  const prevStatus = useRef<string>(status);

  useEffect(() => {
    if (status === "flagged" && prevStatus.current !== "flagged") {
      shakeTimer.current = 0; // Trigger single shake
    }
    prevStatus.current = status;
  }, [status]);

  // Status colors & material settings
  const { foilColor, pocketColor, emissiveColor, roughness, metalness } = useMemo(() => {
    switch (status) {
      case "flagged":
        return {
          foilColor: "#b91c1c",
          pocketColor: "#ef4444",
          emissiveColor: "#7f1d1d",
          roughness: 0.35,
          metalness: 0.7,
        };
      case "expired":
        return {
          foilColor: "#b45309",
          pocketColor: "#f59e0b",
          emissiveColor: "#78350f",
          roughness: 0.55, // dimmer
          metalness: 0.5,
        };
      case "no_match":
        return {
          foilColor: "#334155",
          pocketColor: "#64748b",
          emissiveColor: "#0f172a",
          roughness: 0.35,
          metalness: 0.75,
        };
      default:
        // Pristine silver metallic foil
        return {
          foilColor: "#94a3b8",
          pocketColor: "#cbd5e1",
          emissiveColor: "#1e293b",
          roughness: 0.28,
          metalness: 0.88,
        };
    }
  }, [status]);

  // Positions for 10 tablet pockets (2 columns x 5 rows)
  const pockets = useMemo(() => {
    const list: [number, number, number][] = [];
    const cols = [-0.55, 0.55];
    const rows = [-1.1, -0.55, 0.0, 0.55, 1.1];
    for (const y of rows) {
      for (const x of cols) {
        list.push([x, y, 0.05]);
      }
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.getElapsedTime();

    // 1. Slow idle rotation & floating bob
    let baseRotY = Math.sin(t * 0.8) * 0.15;
    let baseRotX = Math.cos(t * 0.6) * 0.08;
    let basePosY = Math.sin(t * 1.5) * 0.06;
    let shakeOffsetX = 0;

    // 2. Interactive tilt towards pointer
    const pointer = state.pointer;
    baseRotY += pointer.x * 0.35;
    baseRotX -= pointer.y * 0.3;

    // 3. FLAGGED: Single damped shake
    if (status === "flagged") {
      shakeTimer.current += delta;
      if (shakeTimer.current < 1.2) {
        // Damped sinusoidal shake
        shakeOffsetX = Math.sin(shakeTimer.current * 35) * 0.15 * Math.exp(-shakeTimer.current * 2.5);
      }
    }

    // 4. Scanning beam sweep
    if (isScanning && scanBarRef.current) {
      const scanCycle = (t * 2) % 2; // 0 to 2
      scanBarRef.current.position.y = 1.6 - scanCycle * 1.6; // Sweeps from top to bottom
    }

    // 5. Warning ring pulse for FLAGGED
    if (status === "flagged" && ringRef.current) {
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      ringRef.current.scale.set(pulse, pulse, pulse);
      ringRef.current.rotation.z += delta * 0.5;
    }

    // 6. Clock/Hourglass ring rotation for EXPIRED
    if (status === "expired" && clockRef.current) {
      clockRef.current.rotation.z -= delta * 0.4;
    }

    // Apply smoothly
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, shakeOffsetX, 0.2);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, basePosY, 0.1);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, baseRotY, 0.1);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, baseRotX, 0.1);
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* Main blister foil card */}
      <RoundedBox args={[2.2, 3.2, 0.08]} radius={0.12} smoothness={3}>
        <meshStandardMaterial
          color={foilColor}
          metalness={metalness}
          roughness={roughness}
          emissive={emissiveColor}
          emissiveIntensity={0.25}
        />
      </RoundedBox>

      {/* 10 Domed tablet pockets */}
      {pockets.map((pos, idx) => (
        <group key={idx} position={pos}>
          {/* Domed blister pocket bump */}
          <mesh scale={[1, 0.65, 0.38]}>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshStandardMaterial
              color={pocketColor}
              metalness={metalness * 0.9}
              roughness={roughness * 0.8}
            />
          </mesh>
          {/* Rim indentation ring */}
          <mesh position={[0, 0, -0.02]} scale={[1, 0.65, 1]}>
            <ringGeometry args={[0.26, 0.29, 12]} />
            <meshStandardMaterial
              color={foilColor}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Sweeping scan bar (active during scanning) */}
      {isScanning && (
        <mesh ref={scanBarRef} position={[0, 0, 0.08]}>
          <boxGeometry args={[2.3, 0.08, 0.02]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      )}

      {/* FLAGGED: Red pulsing warning ring */}
      {status === "flagged" && (
        <mesh ref={ringRef} position={[0, 0, -0.1]}>
          <torusGeometry args={[1.9, 0.04, 8, 32]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.9}
          />
        </mesh>
      )}

      {/* EXPIRED: Amber clock ring */}
      {status === "expired" && (
        <group ref={clockRef} position={[0, 0, -0.1]}>
          <mesh>
            <torusGeometry args={[1.8, 0.035, 8, 32]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#b45309"
              emissiveIntensity={0.6}
            />
          </mesh>
          {/* Hour markers */}
          {[0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].map((angle, i) => (
            <mesh
              key={i}
              position={[Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0]}
            >
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#fbbf24" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

