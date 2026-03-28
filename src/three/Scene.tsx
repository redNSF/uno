/**
 * Scene.tsx — Main R3F Canvas + camera setup
 */

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Table } from './Table';
import { Lighting } from './Lighting';
import { PostFX } from './PostFX';
import { Seat } from './Seat';
import { Particles } from './Particles';
import { HUD } from '../ui/HUD';
import { computeSeatPositions } from '../utils/seatLayout';
import { useUnoStore } from '../game/store';

// ---- Camera Controller ----
function CameraController({ playerCount }: { playerCount: number }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 8, 7));
  const time = useRef(0);

  // Pull back for more players
  const zOffset = playerCount > 4 ? (playerCount - 4) * 1.5 : 0;
  const yOffset = playerCount > 4 ? (playerCount - 4) * 0.5 : 0;

  useFrame((_, delta) => {
    time.current += delta;
    // Idle float
    const floatY = Math.sin(time.current * 0.4) * 0.1;

    targetPos.current.set(0, 8 + yOffset + floatY, 7 + zOffset);

    // Smooth lerp
    camera.position.lerp(targetPos.current, 0.02);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ---- Game Scene Content ----
function GameSceneContent() {
  const game = useUnoStore((s) => s.game);
  const myPlayerId = useUnoStore((s) => s.myPlayerId);

  if (!game) return null;

  const { players, currentPlayerIndex } = game;
  const seatPositions = computeSeatPositions(players.length);
  const isWon = game.phase === 'game-end';

  return (
    <>
      <CameraController playerCount={players.length} />
      <Table playerCount={players.length} />
      <Lighting />

      {players.map((player, i) => {
        const sp = seatPositions[i];
        return (
          <Seat
            key={player.id}
            player={player}
            isActive={i === currentPlayerIndex}
            position={sp.position}
            rotation={sp.rotation}
          />
        );
      })}

      <Particles active={isWon} />
      <PostFX />
    </>
  );
}

// ---- Scene Component ----
export function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: false, // handled by SMAA post-processing
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <GameSceneContent />
      </Suspense>
    </Canvas>
  );
}
