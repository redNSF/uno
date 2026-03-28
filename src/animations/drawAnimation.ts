/**
 * drawAnimation.ts — Draw card snap animation
 */

import gsap from 'gsap';
import * as THREE from 'three';

export function drawAnimation(
  cardMesh: THREE.Object3D,
  deckPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  faceUp: boolean,
  onComplete?: () => void
): void {
  cardMesh.position.copy(deckPos);
  cardMesh.rotation.set(0, 0, 0);

  const mid = new THREE.Vector3(
    (deckPos.x + targetPos.x) / 2,
    Math.max(deckPos.y, targetPos.y) + 1.0,
    (deckPos.z + targetPos.z) / 2
  );

  gsap.timeline({ onComplete }).to(cardMesh.position, {
    keyframes: [
      { x: mid.x, y: mid.y, z: mid.z, duration: 0.2, ease: 'power2.out' },
      { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 0.15, ease: 'power2.in' },
    ],
  }).to(cardMesh.rotation, {
    y: faceUp ? Math.PI : 0,
    duration: 0.2,
    ease: 'power1.inOut',
  }, '-=0.2');
}
