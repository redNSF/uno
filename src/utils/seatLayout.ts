// ============================================
// Seat Layout Calculator
// Computes 3D seat positions for 2–7 players
// around an oval table
// ============================================

import { SCENE, MAX_PLAYERS } from './constants';
import * as THREE from 'three';

export interface SeatLayout {
  position: THREE.Vector3;
  /** Angle in radians — 0 = bottom (human seat, toward camera) */
  angle: number;
  /** Euler Y rotation for the seat nameplate/chair to face table center */
  rotationY: number;
  /** Hand fan direction — angle pointing inward toward table center */
  handAngle: number;
  /** For camera: how far to pull back */
  cameraDistance: number;
  /** Camera height */
  cameraHeight: number;
}

// Seat angles for N players — human always at index 0 (bottom, angle = 0)
const SEAT_ANGLE_MAPS: Record<number, number[]> = {
  2: [0, Math.PI],
  3: [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3],
  4: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
  5: [0, (2 * Math.PI * 1) / 5, (2 * Math.PI * 2) / 5, (2 * Math.PI * 3) / 5, (2 * Math.PI * 4) / 5],
  6: [0, (2 * Math.PI) / 6, (2 * Math.PI * 2) / 6, (2 * Math.PI * 3) / 6, (2 * Math.PI * 4) / 6, (2 * Math.PI * 5) / 6],
  7: [0, (2 * Math.PI) / 7, (2 * Math.PI * 2) / 7, (2 * Math.PI * 3) / 7, (2 * Math.PI * 4) / 7, (2 * Math.PI * 5) / 7, (2 * Math.PI * 6) / 7],
};

// Camera settings by player count
const CAMERA_PRESETS: Record<number, { distance: number; height: number }> = {
  2: { distance: 6.5,  height: 5.0 },
  3: { distance: 7.0,  height: 5.2 },
  4: { distance: 7.5,  height: 5.5 },
  5: { distance: 8.2,  height: 5.8 },
  6: { distance: 8.8,  height: 6.2 },
  7: { distance: 9.5,  height: 6.5 },
};

/**
 * Compute seat positions and orientations for N players around an oval table.
 * Index 0 is always the human player at the bottom.
 */
export function computeSeatLayouts(playerCount: number): SeatLayout[] {
  const count = Math.max(2, Math.min(MAX_PLAYERS, playerCount));
  const angles = SEAT_ANGLE_MAPS[count] ?? SEAT_ANGLE_MAPS[7];
  const camera = CAMERA_PRESETS[count] ?? CAMERA_PRESETS[7];

  // Oval radii scale slightly with player count
  const rx = SCENE.TABLE_BASE_RADIUS_X + (count - 2) * SCENE.TABLE_SCALE_PER_PLAYER * 3;
  const rz = SCENE.TABLE_BASE_RADIUS_Z + (count - 2) * SCENE.TABLE_SCALE_PER_PLAYER * 2;

  return angles.map((rawAngle) => {
    // Seat angle: 0 = bottom (toward +Z, i.e., toward camera)
    // Rotate so 0 is at +Z (front of table)
    const angle = rawAngle - Math.PI / 2;  // shift so 0 is at bottom

    // Oval position
    const x = rx * Math.cos(angle);
    const z = rz * Math.sin(angle);

    const position = new THREE.Vector3(x, 0, z);

    // Chair faces table center (inward)
    const rotationY = -angle + Math.PI;

    // Hand fan direction (cards face toward camera/player, tilted inward)
    const handAngle = angle;

    return {
      position,
      angle,
      rotationY,
      handAngle,
      cameraDistance: camera.distance,
      cameraHeight: camera.height,
    };
  });
}

/**
 * Get the 3D position for a player's hand fan center
 */
export function getHandPosition(seat: SeatLayout, heightOffset = 0.15): THREE.Vector3 {
  return new THREE.Vector3(
    seat.position.x * 0.88,
    seat.position.y + heightOffset,
    seat.position.z * 0.88
  );
}

/**
 * Get point light position for a player's seat (slightly elevated)
 */
export function getSeatLightPosition(seat: SeatLayout): THREE.Vector3 {
  return new THREE.Vector3(
    seat.position.x * 0.7,
    2.5,
    seat.position.z * 0.7
  );
}

/**
 * Camera position from seat layout
 */
export function getCameraPosition(layouts: SeatLayout[]): THREE.Vector3 {
  if (!layouts[0]) return new THREE.Vector3(0, 5.5, 7.5);
  const { cameraDistance, cameraHeight } = layouts[0];
  return new THREE.Vector3(0, cameraHeight, cameraDistance);
}

/**
 * Get table scale factor for given player count
 */
export function getTableScale(playerCount: number): [number, number, number] {
  const factor = 1 + (playerCount - 2) * 0.05;
  return [factor, 1, factor];
}
