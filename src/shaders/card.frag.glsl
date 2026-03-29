// ─── Holographic Card Fragment Shader ─────────────────────────────────────
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

uniform float uTime;
uniform sampler2D uFaceTexture;
uniform float uHoloIntensity;  // 0 = normal card, 1 = full holo wild

// ── Rainbow Iridescence ────────────────────────────────────────────────────
vec3 rainbow(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec4 faceColor = texture2D(uFaceTexture, vUv);

  // Fresnel
  float ndv = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
  float fresnel = pow(1.0 - ndv, 2.5);

  // Animated UV shift for the foil shimmer
  vec2 foilUv = vUv + vec2(sin(uTime * 0.5) * 0.02, cos(uTime * 0.4) * 0.02);
  float foilGrad = foilUv.x * 0.6 + foilUv.y * 0.4 + uTime * 0.08;
  vec3 holo = rainbow(foilGrad) * (fresnel + 0.2);

  vec3 color = mix(faceColor.rgb, faceColor.rgb + holo * 0.6, uHoloIntensity * fresnel);

  gl_FragColor = vec4(color, faceColor.a);
}
