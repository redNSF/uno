import gsap from 'gsap'
import type { Vec3 } from '../utils/math'
import { bezierQuad } from '../utils/math'

export interface JumpInTarget {
  setPosition: (x: number, y: number, z: number) => void
  setVisible: (v: boolean) => void
}

/**
 * Card fires in from off-screen to the discard pile.
 */
export function jumpInAnimation(
  target: JumpInTarget,
  discardPos: Vec3,
  onComplete?: () => void,
): gsap.core.Timeline {
  const from: Vec3 = { x: -6, y: 3, z: -2 }
  const mid: Vec3 = { x: (from.x + discardPos.x) / 2, y: 4.5, z: (from.z + discardPos.z) / 2 }
  const progress = { t: 0 }
  const tl = gsap.timeline({ onComplete })

  target.setVisible(true)
  target.setPosition(from.x, from.y, from.z)

  tl.to(progress, {
    t: 1,
    duration: 0.55,
    ease: 'power3.out',
    onUpdate() {
      const pos = bezierQuad(from, mid, discardPos, progress.t)
      target.setPosition(pos.x, pos.y, pos.z)
    },
  })

  return tl
}
