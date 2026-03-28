/**
 * winAnimation.ts — Win sequence: bloom flood + camera flyout
 */

import gsap from 'gsap';
import * as THREE from 'three';

export function playWinAnimation(camera: THREE.Camera, onComplete?: () => void): void {
  const startPos = camera.position.clone();
  const tl = gsap.timeline({ onComplete });

  // Camera pulls back and up dramatically
  tl.to(camera.position, {
    y: startPos.y + 4,
    z: startPos.z + 6,
    duration: 1.5,
    ease: 'power2.out',
  })
  .to(camera.position, {
    y: startPos.y + 2,
    duration: 1.0,
    ease: 'power2.inOut',
  });
}

export function playLoseAnimation(camera: THREE.Camera, onComplete?: () => void): void {
  const startPos = camera.position.clone();

  gsap.timeline({ onComplete })
    .to(camera.position, {
      y: startPos.y - 1,
      duration: 0.5,
      ease: 'power3.in',
    })
    .to(camera.position, {
      y: startPos.y,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)',
    });
}
