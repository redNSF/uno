// ─── Felt Table Fragment Shader ───────────────────────────────────────────
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uGoldColor;
uniform float uGoldTrimWidth;

// ── Noise ─────────────────────────────────────────────────────────────────
float hash(vec2 p) {
  p = fract(p * vec2(443.8975, 397.2973));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1, 0));
  float c = hash(i + vec2(0, 1));
  float d = hash(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// ── Microfiber Noise ──────────────────────────────────────────────────────
float feltFiber(vec2 uv) {
  float n = noise(uv * 120.0) * 0.5;
  n += noise(uv * 60.0) * 0.3;
  n += noise(uv * 30.0) * 0.2;
  return n;
}

// ── Anisotropic Sheen ─────────────────────────────────────────────────────
float sheen(vec3 normal, vec3 viewDir) {
  float ndv = max(dot(normal, viewDir), 0.0);
  return pow(1.0 - ndv, 3.0) * 0.6;
}

// ── UNO Watermark ─────────────────────────────────────────────────────────
float unoLetterU(vec2 p) {
  p = abs(p) - vec2(0.07, 0.0);
  float d = max(p.x - 0.04, -p.y - 0.10);
  float arc = length(p - vec2(0.0, -0.10)) - 0.07;
  return min(d, arc);
}

void main() {
  vec2 uv = vUv;

  // Felt base color with fiber noise
  float fiber = feltFiber(uv);
  vec3 feltColor = uBaseColor * (0.85 + fiber * 0.3);

  // Gold trim border
  float borderDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  float goldMask = smoothstep(uGoldTrimWidth + 0.003, uGoldTrimWidth, borderDist);
  float goldPulse = 1.0 + 0.05 * sin(uTime * 1.5 + borderDist * 40.0);
  vec3 goldColor = uGoldColor * goldPulse;

  // UNO watermark in center
  vec2 centered = (uv - 0.5) * 3.5;
  float logoMask = smoothstep(0.01, -0.01, unoLetterU(centered));
  float watermarkAlpha = logoMask * 0.06;

  // Combine
  vec3 color = mix(feltColor, goldColor, goldMask);
  color = mix(color, vec3(1.0), watermarkAlpha);

  // Sheen (approximate view direction from normal in view space)
  vec3 fakeCam = normalize(vec3(0.0, 1.0, 0.4));
  float s = sheen(vNormal, fakeCam);
  color += vec3(0.05, 0.12, 0.05) * s;

  gl_FragColor = vec4(color, 1.0);
}
