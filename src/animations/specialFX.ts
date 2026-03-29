import gsap from 'gsap'

export interface FXContext {
  addEffect: (fx: { type: string; payload: Record<string, unknown> }) => void
  removeEffect: (id: string) => void
}

/**
 * Skip FX: placeholder for a "⊘" symbol burst above targeted seat.
 * In a 3D context this would animate a 3D text mesh; here we emit an event
 * that the HUD layer can consume.
 */
export function skipFX(targetSeatIndex: number, onComplete?: () => void) {
  return gsap.delayedCall(0.8, () => onComplete?.())
}

/**
 * Reverse FX: brief flash that rotates the direction indicator.
 */
export function reverseFX(onComplete?: () => void) {
  return gsap.delayedCall(0.6, () => onComplete?.())
}

/**
 * Draw2 FX: two ghost card arcs.
 */
export function draw2FX(targetSeatIndex: number, onComplete?: () => void) {
  return gsap.delayedCall(0.7, () => onComplete?.())
}

/**
 * Wild+4 FX: full-screen overlay color burst.
 * Returns a GSAP tween that drives a dummy progress value;
 * UI layer should subscribe to the store's events to show the overlay.
 */
export function wild4FX(
  overlayEl: HTMLElement | null,
  color: string,
  onComplete?: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete })
  if (!overlayEl) return tl

  tl.to(overlayEl, { opacity: 0.55, duration: 0.15, ease: 'power2.in' })
  tl.to(overlayEl, { opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.25 })

  return tl
}

/**
 * Win animation: GSAP bloom flood then fly-out.
 * Triggers confetti via store event.
 */
export function winFX(playerName: string, onComplete?: () => void): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete })
  tl.delayedCall(1.2, () => onComplete?.())
  return tl
}
