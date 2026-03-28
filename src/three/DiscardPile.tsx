/**
 * DiscardPile.tsx — Top card visible with shockwave ring on play
 */

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Card as CardType } from '../game/logic';
import { generateCardTexture } from '../textures/CardTextureGenerator';

interface DiscardPileProps {
  topCard: CardType | null;
  position?: [number, number, number];
}

export function DiscardPile({ topCard, position = [1.2, 0, 0] }: DiscardPileProps) {
  const shockwaveRef = useRef<THREE.Mesh>(null!);
  const shockwaveActive = useRef(false);
  const shockwaveTime = useRef(0);
  const prevTopCard = useRef<CardType | null>(null);

  // Detect new card played
  useEffect(() => {
    if (topCard && topCard.id !== prevTopCard.current?.id) {
      shockwaveActive.current = true;
      shockwaveTime.current = 0;
    }
    prevTopCard.current = topCard;
  }, [topCard?.id]);

  useFrame((_, delta) => {
    if (shockwaveRef.current && shockwaveActive.current) {
      shockwaveTime.current += delta;
      const t = shockwaveTime.current;
      const s = 1 + t * 4;
      shockwaveRef.current.scale.setScalar(s);
      (shockwaveRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.7 - t * 1.5);
      if (t > 0.5) {
        shockwaveActive.current = false;
        shockwaveRef.current.scale.setScalar(1);
        (shockwaveRef.current.material as THREE.MeshStandardMaterial).opacity = 0;
      }
    }
  });

  const texture = topCard ? generateCardTexture(topCard) : null;

  return (
    <group position={position}>
      {/* Ghost cards below (depth stack) */}
      {[-0.012, -0.006].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} rotation={[0, (i - 0.5) * 0.1, 0]}>
          <planeGeometry args={[0.7, 1.05]} />
          <meshStandardMaterial color="#888" roughness={0.6} opacity={0.4} transparent />
        </mesh>
      ))}

      {/* Top card */}
      {texture && (
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.7, 1.05]} />
          <meshStandardMaterial map={texture} roughness={0.3} metalness={0.05} />
        </mesh>
      )}

      {/* Shockwave ring */}
      <mesh ref={shockwaveRef} position={[0, 0, -0.02]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.38, 0.44, 32]} />
        <meshStandardMaterial
          color={topCard?.color && topCard.color !== 'wild' ? getCardColor(topCard.color) : '#D4AF37'}
          emissive={topCard?.color && topCard.color !== 'wild' ? getCardColor(topCard.color) : '#D4AF37'}
          emissiveIntensity={1}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function getCardColor(color: string): string {
  const map: Record<string, string> = {
    red: '#E53E3E',
    blue: '#3182CE',
    green: '#38A169',
    yellow: '#ECC94B',
  };
  return map[color] ?? '#D4AF37';
}
