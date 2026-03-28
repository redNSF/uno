/**
 * jumpInAnimation.ts — Jump-in card fire animation
 */

import gsap from 'gsap';
import * as THREE from 'three';

export function jumpInCardAnimation(
  cardMesh: THREE.Object3D,
  discardPos: THREE.Vector3,
  originSeatPos: THREE.Vector3,
  onComplete?: () => void
): void {
  // Card fires in from off-seat position with whip-pan energy
  const offscreen = originSeatPos.clone().add(new THREE.Vector3(0, 0, -3));

  cardMesh.position.copy(offscreen);
  cardMesh.scale.setScalar(1.2);

  gsap.timeline({ onComplete })
    .to(cardMesh.position, {
      x: discardPos.x,
      y: discardPos.y + 0.6,
      z: discardPos.z,
      duration: 0.2,
      ease: 'power4.out',
    })
    .to(cardMesh.position, {
      y: discardPos.y,
      duration: 0.08,
      ease: 'power3.in',
    })
    .to(cardMesh.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.15,
      ease: 'elastic.out(1.5, 0.4)',
    }, '-=0.1');
}
