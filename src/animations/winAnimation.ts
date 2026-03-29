import gsap from 'gsap'

export interface WinAnimContext {
  bloomIntensity: { value: number }
  cameraPosition: { y: number; z: number }
  onConfetti: () => void
}

/**
 * Win sequence:
 * 1. Confetti launch (physics via Particles component)
 * 2. Bloom flood
 * 3. Camera fly-out
 */
export function winAnimation(ctx: WinAnimContext, onComplete?: () => void): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete })

  // Trigger confetti
  tl.call(() => ctx.onConfetti())

  // Bloom flood
  tl.to(ctx.bloomIntensity, {
    value: 2.8,
    duration: 0.6,
    ease: 'power2.in',
  })
  tl.to(ctx.bloomIntensity, {
    value: 0.8,
    duration: 1.2,
    ease: 'power2.out',
  })

  // Camera pull-back
  tl.to(ctx.cameraPosition, {
    y: ctx.cameraPosition.y + 2.5,
    z: ctx.cameraPosition.z + 3,
    duration: 1.8,
    ease: 'power3.inOut',
  }, '-=1.2')

  return tl
}
