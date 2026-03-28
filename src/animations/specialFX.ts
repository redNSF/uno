/**
 * specialFX.ts — Special card visual effects
 */

import gsap from 'gsap';
import * as THREE from 'three';

/** Skip: 3D ⊘ symbol above targeted seat, spin + dissolve */
export function skipFX(scene: THREE.Scene, targetPos: THREE.Vector3, onComplete?: () => void): void {
  const geo = new THREE.RingGeometry(0.25, 0.3, 32);
  const mat = new THREE.MeshStandardMaterial({ color: '#FC8181', emissive: '#FC8181', emissiveIntensity: 1, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(geo, mat);
  ring.position.copy(targetPos).add(new THREE.Vector3(0, 1.5, 0));
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  gsap.timeline({ onComplete: () => { scene.remove(ring); ring.geometry.dispose(); onComplete?.(); } })
    .from(ring.scale, { x: 0, y: 0, z: 0, duration: 0.2, ease: 'back.out(2)' })
    .to(ring.rotation, { z: Math.PI, duration: 0.4, ease: 'power2.out' }, 0)
    .to(mat, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.3)
    .set({}, {}, 0.6);
}

/** Reverse: camera-space rotation indicator */
export function reverseFX(onComplete?: () => void): void {
  // Animate via CSS overlay — triggered from HUD toast
  setTimeout(onComplete ?? (() => {}), 800);
}

/** Draw2: two ghost cards arc to target */
export function draw2FX(scene: THREE.Scene, fromPos: THREE.Vector3, toPos: THREE.Vector3, onComplete?: () => void): void {
  const cards: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const geo = new THREE.BoxGeometry(0.7, 1.05, 0.01);
    const mat = new THREE.MeshStandardMaterial({ color: '#4A5568', opacity: 0.7, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(fromPos);
    scene.add(mesh);
    cards.push(mesh);

    const mid = new THREE.Vector3(
      (fromPos.x + toPos.x) / 2, Math.max(fromPos.y, toPos.y) + 1.5, (fromPos.z + toPos.z) / 2
    );

    gsap.timeline({
      delay: i * 0.12,
      onComplete: i === 1 ? () => {
        cards.forEach((c) => { scene.remove(c); c.geometry.dispose(); });
        onComplete?.();
      } : undefined,
    })
    .to(mesh.position, {
      keyframes: [
        { x: mid.x, y: mid.y, z: mid.z, duration: 0.2, ease: 'power2.out' },
        { x: toPos.x, y: toPos.y, z: toPos.z, duration: 0.15, ease: 'power2.in' },
      ],
    })
    .to(mat, { opacity: 0, duration: 0.1 }, '>-0.1');
  }
}

/** Wild+4: full-screen color shift + 4 explosive arcs */
export function wild4FX(
  scene: THREE.Scene,
  fromPos: THREE.Vector3,
  toPos: THREE.Vector3,
  onComplete?: () => void
): void {
  const COLORS = ['#E53E3E', '#3182CE', '#38A169', '#ECC94B'];

  COLORS.forEach((color, i) => {
    const geo = new THREE.BoxGeometry(0.65, 1.0, 0.01);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, opacity: 0.9, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(fromPos);
    scene.add(mesh);

    const angle = (i / 4) * Math.PI * 2;
    const spread = 1.5;
    const mid = new THREE.Vector3(
      toPos.x + Math.cos(angle) * spread,
      toPos.y + 2,
      toPos.z + Math.sin(angle) * spread
    );

    gsap.timeline({
      delay: i * 0.06,
      onComplete: i === 3 ? () => {
        scene.remove(mesh); mesh.geometry.dispose(); onComplete?.();
      } : undefined,
    })
    .to(mesh.position, {
      keyframes: [
        { x: mid.x, y: mid.y, z: mid.z, duration: 0.25, ease: 'power2.out' },
        { x: toPos.x, y: toPos.y, z: toPos.z, duration: 0.2, ease: 'power2.in' },
      ],
    })
    .to(mat, { opacity: 0, duration: 0.1 }, '>-0.1');
  });

  // Clean up straggler
  setTimeout(onComplete ?? (() => {}), 700);
}

/** Jump-in: off-screen fire + JUMP IN text */
export function jumpInFX(scene: THREE.Scene, cardPos: THREE.Vector3, onComplete?: () => void): void {
  // Rapid scale-in effect on the card position
  const geo = new THREE.RingGeometry(0.5, 0.6, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: '#D4AF37', emissive: '#D4AF37', emissiveIntensity: 2,
    transparent: true, opacity: 1, side: THREE.DoubleSide
  });
  const burst = new THREE.Mesh(geo, mat);
  burst.position.copy(cardPos);
  burst.rotation.x = Math.PI / 2;
  scene.add(burst);

  gsap.timeline({ onComplete: () => { scene.remove(burst); burst.geometry.dispose(); onComplete?.(); } })
    .from(burst.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 0.15, ease: 'back.out(4)' })
    .to(burst.scale, { x: 4, y: 4, z: 4, duration: 0.4, ease: 'power2.out' })
    .to(mat, { opacity: 0, duration: 0.3 }, 0.2);
}
