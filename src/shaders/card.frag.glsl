// card.frag.glsl — Holographic foil shader for wild cards
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDir;

uniform float uTime;
uniform sampler2D uCardTexture;
uniform float uHoloStrength;
uniform vec3 uBaseColor;

// Fresnel
float fresnel(vec3 N, vec3 V, float power) {
  return pow(1.0 - clamp(dot(N, V), 0.0, 1.0), power);
}

// Rainbow from hue shift
vec3 rainbow(float t) {
  vec3 c = vec3(
    sin(t * 6.283) * 0.5 + 0.5,
    sin(t * 6.283 + 2.094) * 0.5 + 0.5,
    sin(t * 6.283 + 4.189) * 0.5 + 0.5
  );
  return c;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vPosition);

  // Sample card texture
  vec4 texColor = texture2D(uCardTexture, vUv);

  // Holographic fresnel
  float f = fresnel(N, V, 2.5);
  float hueShift = vUv.x * 0.6 + vUv.y * 0.4 + uTime * 0.15;
  vec3 holo = rainbow(hueShift) * f * uHoloStrength;

  // Animated UV shimmer lines
  float lines = sin(vUv.y * 40.0 + uTime * 2.0) * 0.5 + 0.5;
  holo += vec3(lines * 0.08 * f);

  // Composite
  vec3 finalColor = texColor.rgb + holo;
  float alpha = texColor.a;

  gl_FragColor = vec4(finalColor, alpha);
}
