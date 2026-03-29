import { SCENE } from './constants'
import type { Vec3 } from './math'

export interface SeatTransform {
  position: Vec3
  rotation: number   // Y-axis rotation so nameplate faces table center
  seatIndex: number
}

/**
 * Computes evenly-spaced seat positions around an oval for N players.
 * Player 0 (human) is always at the bottom-center (front of screen).
 */
export function computeSeatLayout(numPlayers: number): SeatTransform[] {
  const seats: SeatTransform[] = []
  const { TABLE_RX, TABLE_RZ } = SCENE

  for (let i = 0; i < numPlayers; i++) {
    // Distribute evenly, starting from the bottom (angle = PI/2 for player 0)
    const frac = i / numPlayers
    const angle = Math.PI / 2 + frac * 2 * Math.PI  // in radians

    const x = TABLE_RX * 1.35 * Math.cos(angle)
    const z = TABLE_RZ * 1.35 * Math.sin(angle)

    // Rotation: face the origin (table center)
    const rotation = Math.atan2(x, z) + Math.PI

    seats.push({
      position: { x, y: 0, z },
      rotation,
      seatIndex: i,
    })
  }

  return seats
}

/**
 * Returns the 3D position used for hand fan layout for a given seat.
 * Slightly further from table center than the nameplate.
 */
export function getHandPosition(seat: SeatTransform): Vec3 {
  const dist = 0.25
  const dx = Math.sin(seat.rotation) * dist
  const dz = Math.cos(seat.rotation) * dist
  return {
    x: seat.position.x + dx,
    y: 0.05,
    z: seat.position.z + dz,
  }
}
