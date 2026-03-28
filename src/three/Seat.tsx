/**
 * Seat.tsx — Per-seat 3D component with nameplate, badge, glow ring
 */

import React, { useRef } from 'react';
import { Html, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Player } from '../game/logic';

interface SeatProps {
  player: Player;
  isActive: boolean;
  position: [number, number, number];
  rotation: number; // Y-axis rotation in radians
}

export function Seat({ player, isActive, position, rotation }: SeatProps) {
  const ringRef = useRef<THREE.Mesh>(null!);
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    if (ringRef.current) {
      const s = isActive ? 1 + Math.sin(time.current * 3) * 0.04 : 1;
      ringRef.current.scale.setScalar(s);
      (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        isActive ? 0.6 + Math.sin(time.current * 3) * 0.3 : 0.1;
    }
  });

  const color = player.signatureColor ?? '#D4AF37';

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Glow ring on floor */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.6 : 0.1}
          transparent
          opacity={isActive ? 0.8 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Chair silhouette */}
      <group position={[0, 0, 0.6]}>
        {/* Chair back */}
        <RoundedBox args={[1.2, 1.4, 0.12]} radius={0.08} position={[0, 0.7, 0]} castShadow>
          <meshStandardMaterial color="#1A1410" roughness={0.7} metalness={0.1} />
        </RoundedBox>
        {/* Seat */}
        <RoundedBox args={[1.2, 0.12, 1.0]} radius={0.05} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#1A1410" roughness={0.7} metalness={0.1} />
        </RoundedBox>
        {/* Leather cushion */}
        <RoundedBox args={[1.0, 0.06, 0.85]} radius={0.04} position={[0, 0.06, -0.05]} castShadow>
          <meshStandardMaterial color="#2A1A0A" roughness={0.5} metalness={0.05} />
        </RoundedBox>
      </group>

      {/* Nameplate */}
      <RoundedBox
        args={[1.4, 0.28, 0.05]}
        radius={0.04}
        position={[0, 0.14, 0.3]}
        castShadow
      >
        <meshStandardMaterial
          color="#141420"
          metalness={0.3}
          roughness={0.4}
          emissive={color}
          emissiveIntensity={isActive ? 0.2 : 0.05}
        />
      </RoundedBox>

      {/* HTML overlay: player info */}
      <Html
        position={[0, 0.5, 0]}
        center
        occlude
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            transform: 'scale(0.5)',
            transformOrigin: 'center',
          }}
        >
          {/* Avatar */}
          <div style={{
            fontSize: '32px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
            border: `2px solid ${isActive ? color : 'rgba(255,255,255,0.1)'}`,
            boxShadow: isActive ? `0 0 12px ${color}` : 'none',
          }}>
            {player.avatar}
          </div>

          {/* Name */}
          <div style={{
            color: isActive ? color : 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            fontFamily: 'Cinzel, serif',
            fontWeight: '700',
            textShadow: isActive ? `0 0 8px ${color}` : 'none',
            letterSpacing: '0.05em',
            maxWidth: '100px',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {player.name}
          </div>

          {/* Card count badge */}
          <div style={{
            background: player.hand.length <= 1 ? '#E53E3E' : 'rgba(0,0,0,0.7)',
            color: player.hand.length <= 1 ? 'white' : 'rgba(212,175,55,0.8)',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: '700',
            padding: '1px 6px',
            borderRadius: '8px',
            border: '1px solid rgba(212,175,55,0.2)',
            boxShadow: player.hand.length <= 1 ? '0 0 8px rgba(229,62,62,0.8)' : 'none',
          }}>
            {player.hand.length} card{player.hand.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Html>
    </group>
  );
}
