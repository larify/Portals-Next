export const BLOOM_EXTRACT_FRAGMENT = `
precision highp float;
uniform sampler2D uImage;
uniform vec2 uRes;
uniform float uThreshold;
void main() {
  vec3 color = texture2D(uImage, gl_FragCoord.xy / uRes).rgb;
  float brightness = dot(color, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(color * smoothstep(uThreshold, uThreshold + 0.01, brightness), 1.0);
}
`;

export const BLOOM_BLUR_FRAGMENT = `
precision highp float;
uniform sampler2D uImage;
uniform vec2 uRes, uDirection, uTexel;
uniform float uRadius;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 color = vec3(0.0);
  float weight = 0.0;
  for (int i = -11; i <= 11; i++) {
    float distance = float(i);
    if (abs(distance) > uRadius) continue;
    float w = exp(-0.5 * distance * distance / (uRadius * uRadius));
    color += texture2D(uImage, uv + uDirection * uTexel * distance).rgb * w;
    weight += w;
  }
  gl_FragColor = vec4(color / weight, 1.0);
}
`;

export const GRADE_FRAGMENT = `
precision highp float;
uniform sampler2D uImage, uBloom0, uBloom1, uBloom2, uBloom3;
uniform vec2 uRes;
uniform float uTime, uExposure, uBloomStrength;
uniform vec4 uBloomFactors;

vec3 toneMap(vec3 color) {
  color *= uExposure / 0.6;
  color = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777) * color;
  vec3 a = color * (color + 0.0245786) - 0.000090537;
  vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
  color = a / b;
  color = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602) * color;
  color = clamp(color, 0.0, 1.0);
  return mix(color * 12.92, 1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), color));
}
vec3 sampleColor(vec2 uv) {
  vec3 color = texture2D(uImage, uv).rgb;
  color += uBloomStrength * (uBloomFactors.x * texture2D(uBloom0, uv).rgb + uBloomFactors.y * texture2D(uBloom1, uv).rgb
    + uBloomFactors.z * texture2D(uBloom2, uv).rgb + uBloomFactors.w * texture2D(uBloom3, uv).rgb);
  return toneMap(color);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes, d = uv - 0.5;
  float radius = length(d), ca = 0.0032 * radius;
  vec3 color = vec3(sampleColor(uv + d * ca).r, sampleColor(uv).g, sampleColor(uv - d * ca).b);
  color *= mix(1.0, smoothstep(0.95, 0.25, radius), 0.5);
  float grain = fract(sin(dot(uv * uRes + fract(uTime) * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 glow = uBloomStrength * (uBloomFactors.x * texture2D(uBloom0, uv).rgb + uBloomFactors.y * texture2D(uBloom1, uv).rgb
    + uBloomFactors.z * texture2D(uBloom2, uv).rgb + uBloomFactors.w * texture2D(uBloom3, uv).rgb);
  float alpha = max(texture2D(uImage, uv).a, clamp(max(glow.r, max(glow.g, glow.b)), 0.0, 1.0));
  color += (grain - 0.5) * 0.03 * alpha;
  gl_FragColor = vec4(color / max(alpha, 0.001), alpha);
}
`;
