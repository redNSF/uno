// ─── Particles / Confetti Fragment Shader ────────────────────────────────
varying vec2 vUv;
varying float vAlpha;
varying vec3 vColor;

uniform float uTime;

void main() {
  // Circular particle
  vec2 c = vUv - 0.5;
  float r = length(c);
  float mask = 1.0 - smoothstep(0.3, 0.5, r);

  // Slight shimmer on each particle
  float shimmer = 0.8 + 0.2 * sin(uTime * 3.0 + vUv.x * 10.0);

  gl_FragColor = vec4(vColor * shimmer, mask * vAlpha);
}
