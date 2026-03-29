import gsap from 'gsap'
import type { Vec3 } from '../utils/math'
import { bezierQuad, arcMid } from '../utils/math'
import { TIMING, SCENE } from '../utils/constants'

export interface AnimTarget {
  setPosition: (x: number, y: number, z: number) => void
  setRotation?: (x: number, y: number, z: number) => void
}

/**
 * Deal animation: arc card from deck position to target seat position.
 * @param target  - Object with setPosition / setRotation callbacks
 * @param seatPos - Destination position (seat hand area)
 * @param cardIndex - Stagger index (0-based)
 * @param onComplete - Called when animation fully lands
 */
export function dealAnimation(
  target: AnimTarget,
  seatPos: Vec3,
  cardIndex: number,
  onComplete?: () => void,
): gsap.core.Tween {
  const from: Vec3 = { x: SCENE.DECK_POSITION[0], y: SCENE.DECK_POSITION[1], z: SCENE.DECK_POSITION[2] }
  from.y += cardIndex * SCENE.CARD_DEPTH * 1.5
  const mid = arcMid(from, seatPos, 2.2)

  const progress = { t: 0 }
  return gsap.to(progress, {
    t: 1,
    duration: TIMING.CARD_ARC_MS / 1000,
    delay: cardIndex * (TIMING.DEAL_STAGGER_MS / 1000),
    ease: 'power2.out',
    onUpdate() {
      const pos = bezierQuad(from, mid, seatPos, progress.t)
      target.setPosition(pos.x, pos.y, pos.z)
    },
    onComplete() {
      target.setPosition(seatPos.x, seatPos.y, seatPos.z)
      onComplete?.()
    },
  })
}

/**
 * Deals a full initial hand to all players.
 * Returns a timeline that completes after all cards are dealt.
 */
export function dealAllAnimation(
  targets: { target: AnimTarget; seatPos: Vec3; cardIndex: number }[],
  onComplete?: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete })
  for (const { target, seatPos, cardIndex } of targets) {
    tl.add(dealAnimation(target, seatPos, cardIndex), cardIndex * (TIMING.DEAL_STAGGER_MS / 1000))
  }
  return tl
}
