// ============================================
// Math Utilities — Bezier, Lerp, Easing
// ============================================

import * as THREE from 'three';

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

// Vector3 lerp
export function lerpV3(
  out: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
  t: number
): THREE.Vector3 {
  return out.set(
    lerp(a.x, b.x, t),
    lerp(a.y, b.y, t),
    lerp(a.z, b.z, t)
  );
}

// Smooth step
export function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

// Smooth step more aggressive
export function smootherStep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Elastic ease out (for card land bounce)
export function elasticOut(t: number, amplitude = 1, period = 0.3): number {
  if (t === 0 || t === 1) return t;
  const s = (period / (2 * Math.PI)) * Math.asin(1 / amplitude);
  return amplitude * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period) + 1;
}

// Cubic bezier curve (3D point on curve)
export function bezierPoint(
  t: number,
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  out: THREE.Vector3
): THREE.Vector3 {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const b0 = mt2 * mt;
  const b1 = 3 * mt2 * t;
  const b2 = 3 * mt * t2;
  const b3 = t2 * t;
  return out.set(
    b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
    b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
    b0 * p0.z + b1 * p1.z + b2 * p2.z + b3 * p3.z
  );
}

// Create a bezier arc control points from src -> dst with a height peak
export function makeDealBezier(
  src: THREE.Vector3,
  dst: THREE.Vector3,
  peakHeight = 2.5
): [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] {
  const mid = new THREE.Vector3().addVectors(src, dst).multiplyScalar(0.5);
  mid.y += peakHeight;

  const c1 = new THREE.Vector3(
    src.x + (mid.x - src.x) * 0.5,
    src.y + peakHeight * 0.7,
    src.z + (mid.z - src.z) * 0.5
  );

  const c2 = new THREE.Vector3(
    dst.x + (mid.x - dst.x) * 0.5,
    dst.y + peakHeight * 0.4,
    dst.z + (mid.z - dst.z) * 0.5
  );

  return [src.clone(), c1, c2, dst.clone()];
}

// Clamp
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Random in range
export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Random int in range [min, max)
export function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

// Fisher-Yates shuffle (in-place)
export function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Convert degrees to radians
export function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Convert radians to degrees
export function rad2deg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Generate card fan positions in local 2D (X spread, Y height)
// Returns array of { x, y, rotation } for each card
export function computeHandFan(
  cardCount: number,
  maxAngle = 70,
  radius = 4.5
): Array<{ x: number; y: number; rotation: number }> {
  if (cardCount === 0) return [];
  if (cardCount === 1) return [{ x: 0, y: 0, rotation: 0 }];

  // Compress angle as cards grow
  const anglePerCard = Math.min(maxAngle / (cardCount - 1), 12);
  const totalAngle = anglePerCard * (cardCount - 1);

  return Array.from({ length: cardCount }, (_, i) => {
    const angle = deg2rad(i * anglePerCard - totalAngle / 2);
    const x = radius * Math.sin(angle);
    const y = radius * (1 - Math.cos(angle)) * 0.15;
    return { x, y, rotation: angle };
  });
}

// Distance between two 3D points
export function dist3(a: THREE.Vector3, b: THREE.Vector3): number {
  return a.distanceTo(b);
}

// Angle between two 2D vectors
export function angle2D(x: number, z: number): number {
  return Math.atan2(z, x);
}
