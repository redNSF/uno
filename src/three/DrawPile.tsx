/**
 * DrawPile.tsx — Deck mesh with floating animation
 */

import React, { useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { generateCardBackTexture } from '../textures/CardTextureGenerator';
import { useUnoStore } from '../game/store';

const CARD_W = 0.7;
const CARD_H = 1.05;
const STACK_HEIGHT = 0.006; // height per card

interface DrawPileProps {
  deckCount: number;
  position?: [number, number, number];
  onDraw?: () => void;
}

export function DrawPile({ deckCount, position = [-1.2, 0, 0], onDraw }: DrawPileProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const time = useRef(0);
  const backTexture = generateCardBackTexture();
  const myPlayerId = useUnoStore((s) => s.myPlayerId);
  const game = useUnoStore((s) => s.game);

  const isMyTurn = game?.players[game.currentPlayerIndex]?.id === myPlayerId;
  const stackHeight = Math.min(deckCount * STACK_HEIGHT, 1.0);

  useFrame((_, delta) => {
    time.current += delta;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(time.current * 1.2) * 0.04;
      groupRef.current.rotation.y = Math.sin(time.current * 0.5) * 0.05;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isMyTurn) onDraw?.();
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={isMyTurn ? handleClick : undefined}
      onPointerOver={isMyTurn ? () => { document.body.style.cursor = 'pointer'; } : undefined}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Stack visual — multiple ghost cards */}
      {Array.from({ length: Math.min(Math.ceil(deckCount / 4), 20) }).map((_, i) => (
        <mesh
          key={i}
          position={[0, i * STACK_HEIGHT * 4, 0]}
        >
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshStandardMaterial map={backTexture} roughness={0.3} metalness={0.05} />
        </mesh>
      ))}

      {/* Glow on hover */}
      {isMyTurn && (
        <mesh position={[0, stackHeight / 2, -0.01]}>
          <planeGeometry args={[CARD_W + 0.1, CARD_H + 0.1]} />
          <meshStandardMaterial
            color="#D4AF37"
            emissive="#D4AF37"
            emissiveIntensity={0.5}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}

      {/* Deck count */}
      <mesh position={[0, stackHeight + 0.12, 0]}>
        {/* Handled by HUD HTML overlay */}
      </mesh>
    </group>
  );
}
