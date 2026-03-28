/**
 * Lighting.tsx — Dynamic scene lighting
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useUnoStore } from '../game/store';

const PLAYER_COLORS = [
  '#DC143C', '#0047AB', '#FFBF00', '#50C878', '#8B00FF', '#FF007F', '#00FFFF'
];

export function Lighting() {
  const game = useUnoStore((s) => s.game);
  const activeIdx = game?.currentPlayerIndex ?? 0;
  const numPlayers = game?.players.length ?? 2;

  const refs = useRef<Array<THREE.PointLight | null>>([]);
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    refs.current.forEach((light, i) => {
      if (!light) return;
      const isActive = i === activeIdx;
      // Pulse active player light
      const targetInt = isActive ? 1.5 + Math.sin(time.current * 3) * 0.4 : 0.3;
      light.intensity += (targetInt - light.intensity) * 0.08;
    });
  });

  return (
    <>
      {/* Warm ambient */}
      <ambientLight intensity={0.4} color="#FFF5E0" />

      {/* Main overhead gold RectAreaLight approximated via directional */}
      <directionalLight
        position={[0, 8, 2]}
        intensity={1.2}
        color="#FFD700"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Rim light — cool blue from behind camera */}
      <directionalLight position={[0, 2, -10]} intensity={0.5} color="#4488FF" />

      {/* Per-player colored point lights */}
      {PLAYER_COLORS.slice(0, Math.max(numPlayers, 2)).map((color, i) => {
        const angle = (i / numPlayers) * Math.PI * 2;
        const radius = 4.5;
        return (
          <pointLight
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            position={[Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius * 0.6]}
            intensity={i === activeIdx ? 1.5 : 0.3}
            color={color}
            distance={8}
            decay={2}
          />
        );
      })}

      {/* Central table glow */}
      <pointLight position={[0, 0.5, 0]} intensity={0.6} color="#D4AF37" distance={5} decay={2} />
    </>
  );
}
