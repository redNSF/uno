/**
 * Card.tsx — 3D Card Mesh with flip animation and raycasting
 */

import React, { useRef, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { Card as CardType } from '../game/logic';
import { generateCardTexture, generateCardBackTexture } from '../textures/CardTextureGenerator';

interface CardProps {
  card: CardType;
  faceUp: boolean;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: (card: CardType) => void;
  onHover?: (card: CardType | null) => void;
  animate?: boolean;
}

const CARD_W = 0.7;
const CARD_H = 1.05;
const CARD_THICKNESS = 0.02;

export function Card({
  card,
  faceUp,
  position,
  rotation = [0, 0, 0],
  scale = 1,
  isPlayable = false,
  isSelected = false,
  onClick,
  onHover,
  animate = false,
}: CardProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const flipRef = useRef(0); // current Y rotation (0 = face-down, PI = face-up)
  const [hovered, setHovered] = useState(false);
  const [displayFaceUp, setDisplayFaceUp] = useState(faceUp);

  const frontTexture = useMemo(() => generateCardTexture(card), [card.id, card.chosenColor]);
  const backTexture = useMemo(() => generateCardBackTexture(), []);

  // Flip animation
  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const targetFlip = faceUp ? Math.PI : 0;
    flipRef.current += (targetFlip - flipRef.current) * delta * 8;
    group.rotation.y = flipRef.current;

    // Swap textures at 90°
    const mid = Math.abs(flipRef.current - targetFlip * 0.5);
    if (mid < 0.5) {
      setDisplayFaceUp(faceUp);
    }

    // Hover lift
    const targetY = isSelected ? 0.4 : hovered ? 0.25 : 0;
    group.position.y += (position[1] + targetY - group.position.y) * delta * 10;

    // Hover glow scale
    const targetScale = isSelected ? scale * 1.05 : hovered ? scale * 1.02 : scale;
    const s = group.scale.x;
    group.scale.setScalar(s + (targetScale - s) * delta * 10);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(card);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isPlayable) {
      setHovered(true);
      onHover?.(card);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(null);
    document.body.style.cursor = 'default';
  };

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      rotation={rotation}
      scale={scale}
      onClick={isPlayable ? handleClick : undefined}
      onPointerOver={isPlayable ? handlePointerOver : undefined}
      onPointerOut={isPlayable ? handlePointerOut : undefined}
    >
      {/* Card body — front face */}
      <mesh position={[0, 0, CARD_THICKNESS / 2]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial
          map={displayFaceUp ? frontTexture : backTexture}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>

      {/* Card body — back face */}
      <mesh position={[0, 0, -CARD_THICKNESS / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshStandardMaterial
          map={displayFaceUp ? backTexture : frontTexture}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>

      {/* Card thickness edges */}
      <RoundedBox
        args={[CARD_W, CARD_H, CARD_THICKNESS]}
        radius={0.02}
        visible={false}
      >
        <meshStandardMaterial color="#E8E0D0" roughness={0.9} />
      </RoundedBox>

      {/* Selection glow */}
      {(isSelected || hovered) && isPlayable && (
        <mesh position={[0, 0, -CARD_THICKNESS / 2 - 0.001]}>
          <planeGeometry args={[CARD_W + 0.06, CARD_H + 0.06]} />
          <meshStandardMaterial
            color={isSelected ? '#D4AF37' : '#FFFFFF'}
            emissive={isSelected ? '#D4AF37' : '#888888'}
            emissiveIntensity={isSelected ? 0.8 : 0.3}
            transparent
            opacity={0.25}
          />
        </mesh>
      )}
    </group>
  );
}
