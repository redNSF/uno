/**
 * Particles.tsx — Confetti / win-screen particle system
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const CONFETTI_COUNT = 300;
const COLORS = ['#E53E3E', '#3182CE', '#38A169', '#ECC94B', '#8B00FF', '#FF007F', '#FFFFFF', '#D4AF37'];

interface ParticlesProps {
  active: boolean;
}

export function Particles({ active }: ParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Physics world
  const worldRef = useRef<CANNON.World | null>(null);
  const bodiesRef = useRef<CANNON.Body[]>([]);
  const colorBuffer = useMemo(() => {
    const arr = new Float32Array(CONFETTI_COUNT * 3);
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const c = new THREE.Color(COLORS[i % COLORS.length]);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, []);

  useEffect(() => {
    if (!active) return;

    // Initialize physics
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.8, 0) });
    worldRef.current = world;

    const bodies: CANNON.Body[] = [];
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const body = new CANNON.Body({
        mass: 0.002,
        shape: new CANNON.Box(new CANNON.Vec3(0.05, 0.05, 0.005)),
        linearDamping: 0.3,
        angularDamping: 0.3,
      });
      // Launch upward with random spread
      body.position.set(
        (Math.random() - 0.5) * 2,
        0.5,
        (Math.random() - 0.5) * 2
      );
      body.velocity.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 12 + 4,
        (Math.random() - 0.5) * 8
      );
      body.angularVelocity.set(
        Math.random() * 10,
        Math.random() * 10,
        Math.random() * 10
      );
      world.addBody(body);
      bodies.push(body);
    }
    bodiesRef.current = bodies;

    return () => {
      for (const b of bodies) world.removeBody(b);
      worldRef.current = null;
      bodiesRef.current = [];
    };
  }, [active]);

  useFrame((_, delta) => {
    if (!active || !worldRef.current || !meshRef.current) return;
    worldRef.current.step(1 / 60, delta, 3);

    bodiesRef.current.forEach((body, i) => {
      dummy.position.set(body.position.x, body.position.y, body.position.z);
      dummy.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
      dummy.scale.set(0.12, 0.12, 0.004);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Fade out pieces below table
      const opacity = body.position.y > -5 ? 1 : 0;
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFETTI_COUNT]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        vertexColors
        roughness={0.8}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
