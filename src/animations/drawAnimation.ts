import gsap from 'gsap'
import type { Vec3 } from '../utils/math'
import { bezierQuad, arcMid } from '../utils/math'
import { TIMING, SCENE } from '../utils/constants'

export interface DrawAnimTarget {
  setPosition: (x: number, y: number, z: number) => void
  setFaceUp?: (v: boolean) => void
}

/**
 * Snap a card from the deck to a player's hand position with a flip.
 */
export function drawAnimation(
  target: DrawAnimTarget,
  toPos: Vec3,
  isHuman = false,
  onComplete?: () => void,
): gsap.core.Timeline {
  const fromPos: Vec3 = {
    x: SCENE.DECK_POSITION[0],
    y: SCENE.DECK_POSITION[1],
    z: SCENE.DECK_POSITION[2],
  }
  const mid = arcMid(fromPos, toPos, 1.8)
  const progress = { t: 0 }

  const tl = gsap.timeline({ onComplete })

  tl.to(progress, {
    t: 1,
    duration: TIMING.CARD_ARC_MS / 1000 * 0.7,
    ease: 'power2.out',
    onUpdate() {
      const pos = bezierQuad(fromPos, mid, toPos, progress.t)
      target.setPosition(pos.x, pos.y, pos.z)
    },
  })

  // Flip face-up for human player at arc midpoint
  if (isHuman) {
    tl.call(() => target.setFaceUp?.(true), [], '-=0.15')
  }

  return tl
}
