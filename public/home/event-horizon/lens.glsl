// Adapted from Event Horizon, Copyright (c) 2026 Hakan Yorganci. See LICENSE.txt.

precision highp float;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uCam, uRight, uUp, uFwd; uniform float uTanHalf, uRcam, uMaxSteps;
uniform float uDisk, uAccretion, uTmax; uniform vec4 uFlare; uniform sampler2D uBB;
uniform vec2 uSrcHalf;
uniform float uSrcZ, uSrcDim;
uniform vec2 uLensCenter;
uniform float uLensScale, uEnvironmentAngle;

vec4 permute4(vec4 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx, x2 = x0 - i2 + C.yyy, x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute4(permute4(permute4(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec3 ns = (1.0 / 7.0) * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy, y = y_ * ns.x + ns.yyyy, h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy), b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0, s1 = floor(b1) * 2.0 + 1.0, sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy, a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x), p1 = vec3(a0.zw, h.y), p2 = vec3(a1.xy, h.z), p3 = vec3(a1.zw, h.w);
  vec4 nr = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3));
  p0 *= nr.x; p1 *= nr.y; p2 *= nr.z; p3 *= nr.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0); m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * snoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }
float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 hash33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }

vec3 blackbody(float T){ float u = (log(clamp(T, 1000.0, 40000.0)) - 6.9078) / 3.6889; return texture2D(uBB, vec2(u, 0.5)).rgb; }

vec3 sky(vec3 d){
  vec3 c = vec3(0.0);
  for (int L = 0; L < 3; L++) {
    float sc = 64.0 * pow(2.0, float(L)); vec3 p = d * sc, id = floor(p), f = fract(p) - 0.5;
    float hh = hash13(id + float(L) * 17.0);
    if (hh > 0.9) {
      vec3 o = (hash33(id) - 0.5) * 0.5; float dd = length(f - o);
      float mag = pow(hash13(id * 1.7 + 3.1), 7.0) * 9.0 + 0.35;
      c += blackbody(mix(3000.0, 14000.0, pow(hash13(id + 9.1), 1.5))) * mag * exp(-dd * dd * 90.0) / (1.0 + float(L) * 1.3);
    }
  }
  vec3 bn = normalize(vec3(0.25, 0.9, -0.35)); float b = dot(d, bn), band = exp(-b * b * 12.0);
  float n1 = fbm(d * 2.4 + 3.0), n2 = fbm(d * 5.5 - 5.0), dust = smoothstep(0.05, 0.45, fbm(d * 4.0 + 1.3));
  c += band * (vec3(0.28, 0.32, 0.6) * max(n1 + 0.45, 0.0) * 0.07 + vec3(0.6, 0.3, 0.22) * max(n2, 0.0) * 0.06) * (1.0 - 0.75 * dust);

  return c;
}

vec4 galaxy(vec2 q){
  vec2 p = q * vec2(uSrcHalf.x / uSrcHalf.y, 1.0) * 1.15;
  float cs = cos(0.5), sn = sin(0.5); p = mat2(cs, -sn, sn, cs) * p; p.y /= 0.55;
  float r = length(p), a = atan(p.y, p.x);
  float arms = pow(0.5 + 0.5 * cos(2.0 * a - 5.2 * log(r + 0.06)), 2.5);
  float n = fbm(vec3(p * 2.6, 3.1)) * 0.5 + 0.5;
  float dust = smoothstep(0.35, 0.75, fbm(vec3(p * 5.5, 8.0)) * 0.5 + 0.5) * arms;
  float disk = exp(-r * 2.4), core = exp(-r * r * 28.0);
  vec3 c = vec3(1.0, 0.82, 0.58) * core * 5.0;
  c += mix(vec3(0.42, 0.55, 1.0), vec3(1.0, 0.78, 0.55), exp(-r * 2.5)) * disk * (0.25 + 1.6 * arms * n) * (1.0 - 0.6 * dust) * 1.3;
  c += vec3(1.0, 0.35, 0.55) * pow(max(n - 0.62, 0.0) * 3.0, 3.0) * arms * disk * 4.0;
  return vec4(c, clamp(disk * 2.2 + core, 0.0, 1.0));
}

vec3 rotateEnvironment(vec3 point) {
  float cs = cos(uEnvironmentAngle), sn = sin(uEnvironmentAngle);
  point.xz = mat2(cs, -sn, sn, cs) * point.xz;
  return point;
}

vec4 sourceShade(vec3 point) {
  vec2 q = point.xy / uSrcHalf;
  if (max(abs(q.x), abs(q.y)) > 1.0) return vec4(0.0);
  vec4 source = galaxy(q);
  source.rgb *= uSrcDim;
  return source;
}

vec4 diskShade(vec3 hp, vec3 rayDir){
  float r = length(hp.xz), x = r / 3.0;
  float prof = x > 1.0 ? pow(x, -0.75) * pow(1.0 - inversesqrt(x), 0.25) / 0.488 : 0.0;
  float inner = smoothstep(2.35, 3.05, r);
  float pr = max(prof, 0.3 * inner * (1.0 - step(3.0, r)));
  float edge = smoothstep(14.0, 8.5, r);
  float phi = atan(hp.z, hp.x), om = sqrt(0.5 / (r * r * r)), lr = log(r);
  const float P = 24.0;
  float ta = mod(uTime, P), tb = mod(uTime + 0.5 * P, P), wa = 1.0 - abs(2.0 * ta / P - 1.0);
  float sa = phi - om * ta * 3.0, sb = phi - om * tb * 3.0 + 2.1;
  float n = mix(fbm(vec3(cos(sb) * 2.2, sin(sb) * 2.2, lr * 7.0 + 13.0)), fbm(vec3(cos(sa) * 2.2, sin(sa) * 2.2, lr * 7.0)), wa);
  float dens = clamp(0.55 + 0.85 * n, 0.0, 1.0);
  float flare = 0.0;
  if (uFlare.w > 0.0) {
    float age = uTime - uFlare.z, rf = uFlare.x, pf = uFlare.y + sqrt(0.5 / (rf * rf * rf)) * age * 3.0;
    vec2 dd = hp.xz - rf * vec2(cos(pf), sin(pf));
    flare = exp(-dot(dd, dd) * 1.6) * uFlare.w * exp(-age * 0.16) * smoothstep(0.0, 0.4, age);
  }
  float beta = min(sqrt(0.5 / max(r - 1.0, 0.02)), 0.95), gam = inversesqrt(1.0 - beta * beta);
  vec3 ephi = normalize(vec3(-hp.z, 0.0, hp.x));
  float g = sqrt(max(1.0 - 1.0 / r, 0.001) / (1.0 - 1.0 / uRcam)) / (gam * (1.0 - beta * dot(ephi, -rayDir)));
  vec3 bb = blackbody(uTmax * pr * (1.0 + 0.6 * flare) * g);
  float L = pow(g, 3.0) * (pow(pr, 3.2) * (0.5 + 0.9 * dens) * uAccretion * 0.9 + flare * 1.6);
  float alpha = max((0.25 + 0.75 * dens) * inner * edge * 0.92, flare * 0.8) * uDisk;
  return vec4(bb * L, clamp(alpha, 0.0, 0.95));
}

void main() {
  vec2 screen = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  vec2 p = (screen - uLensCenter) / max(uLensScale, 0.001);
  vec3 vel = normalize(uFwd + uTanHalf * (p.x * uRight + p.y * uUp));
  vec3 pos = uCam;
  vec3 angularMomentum = cross(pos, vel);
  float h2 = dot(angularMomentum, angularMomentum);
  vec3 color = vec3(0.0);
  float transmission = 1.0;
  bool captured = false;
  for (int i = 0; i < 400; i++) {
    if (float(i) >= uMaxSteps) break;
    float r2 = dot(pos, pos), r = sqrt(r2);
    float dt = clamp(0.045 * r * sqrt(r), 0.012, 0.16 * r);
    vec3 previous = pos;
    vec3 halfVelocity = vel - 0.75 * dt * h2 * pos / (r2 * r2 * r);
    pos += dt * halfVelocity;
    float q2 = dot(pos, pos), q = sqrt(q2);
    vel = halfVelocity - 0.75 * dt * h2 * pos / (q2 * q2 * q);
    if (q < 1.0) { captured = true; break; }
    vec3 sourcePrevious = rotateEnvironment(previous), sourcePosition = rotateEnvironment(pos);
    if (sourcePrevious.z > uSrcZ && sourcePosition.z <= uSrcZ) {
      vec4 source = sourceShade(mix(sourcePrevious, sourcePosition,
        (sourcePrevious.z - uSrcZ) / (sourcePrevious.z - sourcePosition.z)));
      color += transmission * source.rgb * source.a;
      transmission *= 1.0 - source.a;
    }
    if (q > 48.0 && dot(pos, vel) > 0.0) break;
  }
  if (!captured) color += transmission * sky(rotateEnvironment(normalize(vel)));
  gl_FragColor = vec4(color, 1.0);
}
