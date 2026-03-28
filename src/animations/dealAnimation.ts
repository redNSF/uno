/**
 * dealAnimation.ts — Bezier arc deal animation via GSAP
 */

import gsap from 'gsap';
import * as THREE from 'three';

export interface DealTarget {
  mesh: THREE.Object3D;
  toPosition: THREE.Vector3;
  toRotation: THREE.Euler;
  delay: number;
  faceUp: boolean;
}

/**
 * Animate cards dealing from deck position to each seat
 * Uses bezier arc via GSAP motion path
 */
export function playDealAnimation(
  targets: DealTarget[],
  deckPosition: THREE.Vector3,
  onComplete?: () => void
): void {
  const tl = gsap.timeline({ onComplete });

  targets.forEach((t, i) => {
    const { mesh, toPosition, toRotation, delay } = t;

    // Start at deck
    mesh.position.copy(deckPosition);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.setScalar(0.8);

    tl.to(mesh.position, {
      x: toPosition.x,
      y: toPosition.y + 1.2, // arc peak
      z: toPosition.z,
      duration: 0.25,
      ease: 'power2.out',
      delay: delay,
    }, i * 0.08)
    .to(mesh.position, {
      x: toPosition.x,
      y: toPosition.y,
      z: toPosition.z,
      duration: 0.15,
      ease: 'power2.in',
    }, `>`)
    .to(mesh.rotation, {
      y: t.faceUp ? Math.PI : 0,
      duration: 0.2,
      ease: 'power1.inOut',
    }, `-=0.1`)
    .to(mesh.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.15,
      ease: 'elastic.out(1, 0.5)',
    }, `-=0.2`);
  });
}

/**
 * Simple arc from A to B with a peak
 */
export function tweenCardArc(
  mesh: THREE.Object3D,
  from: THREE.Vector3,
  to: THREE.Vector3,
  duration: number = 0.4,
  onComplete?: () => void
): void {
  const midY = Math.max(from.y, to.y) + 1.5;

  gsap.to(mesh.position, {
    keyframes: [
      { x: from.x, y: from.y, z: from.z, duration: 0 },
      { x: (from.x + to.x) / 2, y: midY, z: (from.z + to.z) / 2, duration: duration * 0.5, ease: 'power2.out' },
      { x: to.x, y: to.y, z: to.z, duration: duration * 0.5, ease: 'power2.in' },
    ],
    ease: 'none',
    onComplete,
  });
}

/**
 * Camera shake on card slam
 */
export function cameraShake(camera: THREE.Camera, intensity: number = 0.15, duration: number = 0.3): void {
  const origin = camera.position.clone();
  const tl = gsap.timeline();

  for (let i = 0; i < 6; i++) {
    tl.to(camera.position, {
      x: origin.x + (Math.random() - 0.5) * intensity,
      y: origin.y + (Math.random() - 0.5) * intensity,
      z: origin.z,
      duration: duration / 6,
      ease: 'none',
    });
  }
  tl.to(camera.position, { x: origin.x, y: origin.y, z: origin.z, duration: 0.05 });
}
