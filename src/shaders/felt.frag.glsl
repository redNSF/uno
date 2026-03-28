// felt.frag.glsl — Microfiber felt surface shader
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 uFeltColor;
uniform vec3 uTrimColor;
uniform float uTime;

// Pseudo-random
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// Value noise
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Anisotropic fiber sheen
float microfiber(vec2 uv, vec3 N, vec3 V) {
  float fiber = noise(uv * 120.0) * 0.5 + noise(uv * 240.0) * 0.25;
  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  float sheen = pow(1.0 - NdotV, 4.0);
  return fiber * sheen * 0.4;
}

// UNO watermark
float unoLogo(vec2 uv) {
  vec2 center = uv - 0.5;
  float circle = 1.0 - smoothstep(0.18, 0.20, length(center));
  return circle * 0.08;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vPosition);

  // Base felt color
  vec3 baseColor = uFeltColor;
  float n = noise(vUv * 60.0) * 0.04;
  baseColor += vec3(n);

  // Felt fiber micro noise
  float sheen = microfiber(vUv, N, V);
  vec3 sheenColor = mix(baseColor, vec3(0.4, 0.8, 0.5), 0.3);
  baseColor = mix(baseColor, sheenColor, sheen);

  // Gold trim at edges
  float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float trim = smoothstep(0.04, 0.045, edgeDist);
  float trimEdge = (1.0 - trim) * 0.7;
  baseColor = mix(uTrimColor, baseColor, trim);

  // UNO watermark
  float logo = unoLogo(vUv);
  baseColor = mix(baseColor, vec3(0.2, 0.5, 0.3), logo);

  // Subtle diffuse lighting
  float diffuse = clamp(dot(N, normalize(vec3(0.5, 1.0, 0.8))), 0.0, 1.0);
  baseColor *= 0.6 + 0.4 * diffuse;

  gl_FragColor = vec4(baseColor, 1.0);
}
