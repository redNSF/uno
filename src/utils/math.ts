// ─── Lerp ─────────────────────────────────────────────────────────────────
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// ─── Clamp ────────────────────────────────────────────────────────────────
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ─── Deg ↔ Rad ─────────────────────────────────────────────────────────────
export const DEG2RAD = Math.PI / 180
export const RAD2DEG = 180 / Math.PI
export function deg(d: number) { return d * DEG2RAD }

// ─── Random Helpers ────────────────────────────────────────────────────────
export function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min)
}
export function randInt(min: number, max: number): number {
  return Math.floor(randFloat(min, max + 1))
}

// ─── Easing Functions ──────────────────────────────────────────────────────
export const ease = {
  inOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  outElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  outBounce: (t: number) => {
    const n1 = 7.5625, d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
}

// ─── Quadratic Bezier (for card arcs) ─────────────────────────────────────
export interface Vec3 { x: number; y: number; z: number }

export function bezierQuad(p0: Vec3, p1: Vec3, p2: Vec3, t: number): Vec3 {
  const mt = 1 - t
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    z: mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z,
  }
}

// Peak control point for card arcs
export function arcMid(p0: Vec3, p2: Vec3, height = 2.5): Vec3 {
  return {
    x: (p0.x + p2.x) / 2,
    y: Math.max(p0.y, p2.y) + height,
    z: (p0.z + p2.z) / 2,
  }
}

// ─── Wrap Angle ────────────────────────────────────────────────────────────
export function wrapAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI
  while (a < -Math.PI) a += 2 * Math.PI
  return a
}

// ─── Distance 3D ──────────────────────────────────────────────────────────
export function dist3(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}
