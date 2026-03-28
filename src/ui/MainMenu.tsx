/**
 * MainMenu.tsx — Full-screen dark casino landing screen
 */

import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useUnoStore } from '../game/store';

// ---- Floating idle card mesh ----
function FloatingCard({ position, rotation, color }: {
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.3;
    ref.current.rotation.x += delta * 0.1;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8} position={position}>
      <mesh ref={ref} rotation={rotation} castShadow>
        <boxGeometry args={[1.2, 1.8, 0.04]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
}

function IdleScene() {
  const COLORS = ['#E53E3E', '#3182CE', '#38A169', '#ECC94B', '#7B2FBE', '#E53E3E', '#3182CE'];
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={2} color="#D4AF37" />
      <pointLight position={[-5, -3, 2]} intensity={0.8} color="#3182CE" />
      <pointLight position={[5, -3, 2]} intensity={0.8} color="#E53E3E" />
      {COLORS.map((c, i) => (
        <FloatingCard
          key={i}
          color={c}
          position={[
            (i - 3) * 2.2,
            Math.sin(i * 1.3) * 1.5,
            -i * 0.5 - 2,
          ]}
          rotation={[0.1, i * 0.3, i * 0.15]}
        />
      ))}
    </>
  );
}

// ---- Main Menu Component ----
export function MainMenu() {
  const setScreen = useUnoStore((s) => s.setScreen);

  return (
    <div className="relative w-full h-full overflow-hidden bg-casino-dark flex flex-col">
      {/* 3D Background scene */}
      <div className="absolute inset-0 opacity-40">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <IdleScene />
        </Canvas>
      </div>

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 10%, rgba(10,10,15,0.85) 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-10 px-6">
        {/* Logo */}
        <div className="text-center select-none">
          <div
            className="font-display text-gold-shimmer mb-1"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)', letterSpacing: '0.2em' }}
          >
            UNO
          </div>
          <div className="font-display text-casino-gold/60 tracking-[0.5em] uppercase text-sm">
            Cinematic Edition
          </div>
        </div>

        {/* Divider */}
        <div className="gold-divider w-48" />

        {/* Menu Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs items-center">
          <button
            id="btn-solo-play"
            className="btn-gold w-full text-lg py-4 tracking-widest"
            onClick={() => setScreen('solo-lobby')}
          >
            Solo Play
          </button>

          <button
            id="btn-party-mode"
            className="btn-ghost w-full text-lg py-4 tracking-widest"
            onClick={() => setScreen('party-lobby')}
          >
            Party Mode
          </button>
        </div>

        {/* Tagline */}
        <div className="text-center text-casino-gold/30 text-xs tracking-widest uppercase">
          2 – 7 Players · AI or Online Multiplayer
        </div>

        {/* Version */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-xs font-mono"
        >
          v1.0.0 · Cinematic UNO
        </div>
      </div>
    </div>
  );
}
