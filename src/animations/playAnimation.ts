import gsap from 'gsap'
import type { Vec3 } from '../utils/math'
import { bezierQuad, arcMid } from '../utils/math'
import { TIMING, SCENE } from '../utils/constants'

export interface PlayAnimTarget {
  setPosition: (x: number, y: number, z: number) => void
  setRotation: (x: number, y: number, z: number) => void
  setVisible: (v: boolean) => void
}

/**
 * Arc a card from a player's hand position to the discard pile.
 * Includes Y-axis spin on arrival + subtle camera shake.
 */
export function playAnimation(
  target: PlayAnimTarget,
  fromPos: Vec3,
  onComplete?: () => void,
): gsap.core.Timeline {
  const toPos: Vec3 = { x: SCENE.DISCARD_POSITION[0], y: 0.1, z: SCENE.DISCARD_POSITION[2] }
  const mid = arcMid(fromPos, toPos, 2.5)

  const progress = { t: 0 }
  const spin = { rot: 0 }
  const tl = gsap.timeline({ onComplete })

  tl.to(progress, {
    t: 1,
    duration: TIMING.CARD_ARC_MS / 1000,
    ease: 'power3.inOut',
    onUpdate() {
      const pos = bezierQuad(fromPos, mid, toPos, progress.t)
      target.setPosition(pos.x, pos.y, pos.z)
    },
  })

  tl.to(spin, {
    rot: Math.PI * 2,
    duration: 0.25,
    ease: 'power1.out',
    onUpdate() {
      target.setRotation(Math.PI / 2, spin.rot, 0)
    },
  }, '-=0.15')

  return tl
}

/**
 * Camera shake for impactful plays.
 */
export function cameraShake(camera: { position: { x: number; y: number } }, intensity = 0.08) {
  const origin = { x: camera.position.x, y: camera.position.y }
  const shake = { t: 0 }
  return gsap.to(shake, {
    t: 1,
    duration: 0.4,
    ease: 'none',
    onUpdate() {
      const amt = (1 - shake.t) * intensity
      camera.position.x = origin.x + (Math.random() - 0.5) * amt
      camera.position.y = origin.y + (Math.random() - 0.5) * amt
    },
    onComplete() {
      camera.position.x = origin.x
      camera.position.y = origin.y
    },
  })
}
