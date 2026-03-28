/**
 * playAnimation.ts — Card play animation + shockwave + camera shake
 */

import gsap from 'gsap';
import * as THREE from 'three';
import { cameraShake } from './dealAnimation';

export function playCardAnimation(
  cardMesh: THREE.Object3D,
  fromPos: THREE.Vector3,
  discardPos: THREE.Vector3,
  camera: THREE.Camera,
  isWild: boolean = false,
  onComplete?: () => void
): void {
  const tl = gsap.timeline({ onComplete });

  // Lift
  tl.to(cardMesh.position, {
    y: fromPos.y + 0.8,
    duration: 0.12,
    ease: 'power2.out',
  })
  // Arc to discard
  .to(cardMesh.position, {
    x: discardPos.x,
    y: discardPos.y + 0.8,
    z: discardPos.z,
    duration: 0.3,
    ease: 'power2.inOut',
  })
  // Spin in air
  .to(cardMesh.rotation, {
    z: Math.PI * 2,
    duration: 0.3,
    ease: 'power2.inOut',
  }, '<')
  // Slam down
  .to(cardMesh.position, {
    y: discardPos.y,
    duration: 0.1,
    ease: 'power3.in',
    onComplete: () => {
      cameraShake(camera, isWild ? 0.25 : 0.1, 0.25);
    },
  });

  // Wild card: prismatic burst
  if (isWild) {
    // Bloom intensity spike handled by PostFX reactively
    tl.to({}, { duration: 0.05 }); // placeholder timing
  }
}

export function drawCardAnimation(
  cardMesh: THREE.Object3D,
  deckPos: THREE.Vector3,
  handPos: THREE.Vector3,
  onComplete?: () => void
): void {
  const tl = gsap.timeline({ onComplete });

  tl.set(cardMesh.position, { x: deckPos.x, y: deckPos.y, z: deckPos.z })
    .to(cardMesh.position, {
      x: (deckPos.x + handPos.x) / 2,
      y: Math.max(deckPos.y, handPos.y) + 1.2,
      z: (deckPos.z + handPos.z) / 2,
      duration: 0.2,
      ease: 'power2.out',
    })
    .to(cardMesh.position, {
      x: handPos.x,
      y: handPos.y,
      z: handPos.z,
      duration: 0.15,
      ease: 'power2.in',
    })
    .to(cardMesh.rotation, {
      y: Math.PI,
      duration: 0.2,
      ease: 'power1.inOut',
    }, '-=0.15');
}
