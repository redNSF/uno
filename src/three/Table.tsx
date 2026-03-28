/**
 * Table.tsx — Oval felt table with custom GLSL shader
 */

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import feltVert from '../shaders/felt.vert.glsl';
import feltFrag from '../shaders/felt.frag.glsl';

interface TableProps {
  playerCount: number;
}

export function Table({ playerCount }: TableProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const uniformsRef = useRef({
    uFeltColor: { value: new THREE.Color('#1A3A2A') },
    uTrimColor: { value: new THREE.Color('#A07820') },
    uTime: { value: 0 },
  });

  useFrame((_, delta) => {
    uniformsRef.current.uTime.value += delta;
  });

  // Scale table for more players
  const scaleX = 1 + (playerCount - 2) * 0.12;
  const scaleZ = 1 + (playerCount - 2) * 0.06;

  return (
    <group position={[0, -0.05, 0]}>
      {/* Main oval felt surface */}
      <mesh ref={meshRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]} scale={[scaleX, scaleZ, 1]}>
        <circleGeometry args={[5, 64]} />
        <shaderMaterial
          vertexShader={feltVert}
          fragmentShader={feltFrag}
          uniforms={uniformsRef.current}
        />
      </mesh>

      {/* Gold trim ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[scaleX * 1.02, scaleZ * 1.02, 1]}>
        <ringGeometry args={[4.9, 5.1, 64]} />
        <meshStandardMaterial
          color="#A07820"
          metalness={0.9}
          roughness={0.2}
          emissive="#5a3f00"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Table base / legs */}
      <mesh position={[0, -0.3, 0]} receiveShadow>
        <cylinderGeometry args={[4.8 * scaleX, 4.8 * scaleX, 0.25, 32]} />
        <meshStandardMaterial color="#1A1410" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
}
