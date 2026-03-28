// particles.frag.glsl — Confetti / win particle shader
varying vec3 vColor;
varying float vAlpha;
varying vec2 vUv;

void main() {
  // Soft circle particle
  float dist = length(vUv - 0.5) * 2.0;
  float alpha = smoothstep(1.0, 0.2, dist) * vAlpha;

  if (alpha < 0.01) discard;

  gl_FragColor = vec4(vColor, alpha);
}
