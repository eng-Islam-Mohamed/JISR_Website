precision highp float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform vec3 ivory;
uniform vec3 sky;
uniform vec3 mist;
uniform vec3 lilac;
uniform vec3 ink;

mat2 rotation(float angle) {
  float c = cos(angle), s = sin(angle);
  return mat2(c, -s, s, c);
}

// A rounded arch: a torus clipped into a bridge with smoothly rounded feet.
float bridge(vec3 p) {
  p.xy = rotation(-0.24 + pointer.x * 0.055) * p.xy;
  p.yz = rotation(-0.32 + pointer.y * 0.045) * p.yz;
  p.xz = rotation(0.24) * p.xz;
  vec3 q = p;
  q.y -= 0.02;
  q.x /= 0.92;
  q.y = max(q.y, 0.0);
  return length(vec2(length(q.xy) - 1.15, q.z)) - 0.22;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(bridge(p + e.xyy) - bridge(p - e.xyy),
    bridge(p + e.yxy) - bridge(p - e.yxy),
    bridge(p + e.yyx) - bridge(p - e.yyx)));
}

// The same quiet ribbons are seen directly and optically displaced through glass.
vec3 environment(vec2 uv) {
  vec3 color = ivory;
  float ribbon = sin(uv.x * 2.3 + uv.y * 1.5 + 0.7) * 0.24;
  color = mix(color, sky, 0.85 * exp(-pow((uv.y + 0.55 + ribbon) * 2.0, 2.0)));
  color = mix(color, lilac, 0.75 * exp(-pow((uv.x - uv.y * 0.42 - 0.8) * 1.6, 2.0)));
  float line = smoothstep(0.012, 0.0, abs(sin(uv.x * 1.5 + uv.y * 0.7 + 0.6)));
  color = mix(color, mist, line * 0.55);
  float wave = uv.y + 0.24 * sin(uv.x * 1.8) + 0.47;
  float ribbonEdge = 1.0 - smoothstep(0.006, 0.013, abs(wave));
  float ribbonFill = (1.0 - smoothstep(0.1, 0.22, abs(wave - 0.16)));
  color = mix(color, mist, ribbonFill * 0.65);
  color = mix(color, ink, ribbonEdge * 0.35);
  float upperWave = uv.y + 0.20 * sin(uv.x * 1.5) - 0.6;
  float upperEdge = 1.0 - smoothstep(0.005, 0.011, abs(upperWave));
  float upperFill = 1.0 - smoothstep(0.06, 0.13, abs(upperWave + 0.08));
  color = mix(color, sky, upperFill * 0.7);
  color = mix(color, ink, upperEdge * 0.38);
  return color;
}

vec3 studio(vec3 ray) {
  vec3 color = mix(mist * 0.48, ivory, 0.5 + 0.5 * ray.y);
  // Broad softbox and narrow strip reflections make the curved thickness readable.
  float softbox = pow(max(dot(ray, normalize(vec3(-0.6, 0.9, 0.8))), 0.0), 12.0);
  float strip = pow(max(dot(ray, normalize(vec3(0.9, 0.15, 0.5))), 0.0), 75.0);
  color += ivory * softbox * 1.3 + ivory * strip * 1.5;
  return color;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
  vec3 rayOrigin = vec3(0.0, 0.12, 4.8);
  vec3 ray = normalize(vec3(uv, -3.15));
  float distance = 0.0;
  float hit = 0.0;
  for (int i = 0; i < 70; i++) {
    vec3 p = rayOrigin + ray * distance;
    float stepDistance = bridge(p);
    if (stepDistance < 0.0014) { hit = 1.0; break; }
    distance += stepDistance * 0.85;
    if (distance > 8.0) break;
  }
  vec3 color = environment(uv);
  // A ground caustic anchors the sculptural bridge without a floating grey blob.
  float caustic = exp(-pow((uv.y + 0.88) * 17.0, 2.0)) * exp(-pow(uv.x * 1.6, 2.0));
  color = mix(color, ivory, caustic * 0.65);
  if (hit > 0.5) {
    vec3 p = rayOrigin + ray * distance;
    vec3 normal = normalAt(p);
    float facing = max(dot(-ray, normal), 0.0);
    float fresnel = 0.045 + 0.955 * pow(1.0 - facing, 4.0);
    // Three optical indices give a restrained chromatic rim, not a rainbow tint.
    vec3 redRay = refract(ray, normal, 1.0 / 1.46);
    vec3 greenRay = refract(ray, normal, 1.0 / 1.48);
    vec3 blueRay = refract(ray, normal, 1.0 / 1.50);
    vec2 base = uv + normal.xy * (0.10 + (1.0 - facing) * 0.20);
    vec3 transmitted = vec3(environment(base + redRay.xy * 0.50).r,
      environment(base + greenRay.xy * 0.50).g,
      environment(base + blueRay.xy * 0.50).b);
    // Dark internal reflection next to the bright rim distinguishes clear glass from plastic.
    float innerEdge = pow(1.0 - facing, 7.0);
    transmitted = mix(transmitted, mist * 0.35, innerEdge * 0.5);
    color = mix(transmitted, studio(reflect(ray, normal)), fresnel * 0.38);
    float sheen = pow(max(dot(normal, normalize(vec3(-0.65, 0.8, 0.9))), 0.0), 180.0);
    color += ivory * sheen * 0.22;
    color = mix(color, ivory, pow(1.0 - facing, 22.0) * 0.72);
  }
  float vignette = 1.0 - smoothstep(0.7, 1.16, length(uv * vec2(0.72, 0.65)));
  gl_FragColor = vec4(color, vignette);
}
