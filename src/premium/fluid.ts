import { finePointer, reduced } from "./util";

const VERT = `#version 300 es
in vec2 p;
out vec2 uv;
void main() {
  uv = p * .5 + .5;
  gl_Position = vec4(p, 0., 1.);
}`;
const frag = (body: string) => `#version 300 es
precision highp float;
in vec2 uv;
out vec4 o;
uniform vec2 texel;
${body}`;
const ADVECT = frag(`
uniform sampler2D vel, src;
uniform float dt, decay;
void main() {
  o = texture(src, uv - dt * texture(vel, uv).xy * texel) / (1. + decay * dt);
}`);
const SPLAT = frag(`
uniform sampler2D src;
uniform vec2 point;
uniform vec3 color;
uniform float radius, aspect;
void main() {
  vec2 d = uv - point;
  d.x *= aspect;
  o = vec4(texture(src, uv).xyz + exp(-dot(d, d) / radius) * color, 1.);
}`);
const CURL = frag(`
uniform sampler2D vel;
void main() {
  float l = texture(vel, uv - vec2(texel.x, 0.)).y, r = texture(vel, uv + vec2(texel.x, 0.)).y;
  float b = texture(vel, uv - vec2(0., texel.y)).x, t = texture(vel, uv + vec2(0., texel.y)).x;
  o = vec4(.5 * (r - l - t + b), 0., 0., 1.);
}`);
const VORTICITY = frag(`
uniform sampler2D vel, curl;
uniform float strength, dt;
void main() {
  float l = texture(curl, uv - vec2(texel.x, 0.)).x, r = texture(curl, uv + vec2(texel.x, 0.)).x;
  float b = texture(curl, uv - vec2(0., texel.y)).x, t = texture(curl, uv + vec2(0., texel.y)).x;
  vec2 f = .5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  f *= strength * texture(curl, uv).x / (length(f) + .0001);
  f.y *= -1.;
  o = vec4(texture(vel, uv).xy + f * dt, 0., 1.);
}`);
const DIVERGENCE = frag(`
uniform sampler2D vel;
void main() {
  float l = texture(vel, uv - vec2(texel.x, 0.)).x, r = texture(vel, uv + vec2(texel.x, 0.)).x;
  float b = texture(vel, uv - vec2(0., texel.y)).y, t = texture(vel, uv + vec2(0., texel.y)).y;
  o = vec4(.5 * (r - l + t - b), 0., 0., 1.);
}`);
const PRESSURE = frag(`
uniform sampler2D pressure, divergence;
void main() {
  float l = texture(pressure, uv - vec2(texel.x, 0.)).x, r = texture(pressure, uv + vec2(texel.x, 0.)).x;
  float b = texture(pressure, uv - vec2(0., texel.y)).x, t = texture(pressure, uv + vec2(0., texel.y)).x;
  o = vec4((l + r + b + t - texture(divergence, uv).x) * .25, 0., 0., 1.);
}`);
const GRADIENT = frag(`
uniform sampler2D pressure, vel;
void main() {
  float l = texture(pressure, uv - vec2(texel.x, 0.)).x, r = texture(pressure, uv + vec2(texel.x, 0.)).x;
  float b = texture(pressure, uv - vec2(0., texel.y)).x, t = texture(pressure, uv + vec2(0., texel.y)).x;
  o = vec4(texture(vel, uv).xy - .5 * vec2(r - l, t - b), 0., 1.);
}`);
// dye holds pigment rather than light, so the smoke reads on ivory and on the dark sections
const DISPLAY = frag(`
uniform sampler2D dye;
void main() {
  vec3 c = texture(dye, uv).rgb;
  float m = max(c.r, max(c.g, c.b));
  float a = smoothstep(0., 1., m) * .78;
  o = vec4(pow(c / max(m, .001), vec3(3.)) * .72 * a, a);
}`);

type Target = { fbo: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };
type Pair = { read: Target; write: Target; swap(): void };
type Program = { use(): void; set: Record<string, WebGLUniformLocation> };

/**
 * Pointer smoke: a small fluid simulation in the brand colours, stirred by the
 * mouse. GPU work starts on the first mouse move and stops once the smoke has
 * faded. Mouse only, off when motion is reduced, and the native cursor is never
 * hidden. Without WebGL2 the page simply has no pointer effect.
 */
export function mountCursor() {
  let scene: ReturnType<typeof createScene> | null | undefined;
  let frame = 0;
  let last = 0;
  let lastMove = 0;
  let hue = 0;
  let prev: { x: number; y: number } | null = null;
  const queue: { x: number; y: number; dx: number; dy: number; boost: number }[] = [];
  const IDLE = 3500; // ms for the smoke to fade once the mouse rests

  const tick = (now: number) => {
    frame = 0;
    if (!scene) return;
    if (reduced() || now - lastMove > IDLE) {
      scene.clear();
      return;
    }
    const dt = Math.min(0.0166, Math.max(0.001, (now - last) / 1000));
    last = now;
    hue = (hue + dt * 0.35) % 1;
    for (const s of queue.splice(0)) scene.splat(s.x, s.y, s.dx, s.dy, hue, s.boost);
    scene.step(dt);
    frame = requestAnimationFrame(tick);
  };
  const stir = (e: PointerEvent, boost: number) => {
    if (e.pointerType !== "mouse" || reduced() || !finePointer()) return;
    if (scene === undefined) scene = createScene();
    if (!scene) return;
    const from = prev ?? { x: e.clientX, y: e.clientY };
    const dx = e.clientX - from.x,
      dy = e.clientY - from.y;
    prev = { x: e.clientX, y: e.clientY };
    // a fast move is laid down as several puffs so it stays one continuous ribbon
    const n = Math.max(1, Math.min(10, Math.ceil(Math.hypot(dx, dy) / 18)));
    for (let i = 1; i <= n; i++)
      queue.push({ x: from.x + (dx * i) / n, y: from.y + (dy * i) / n, dx: dx / n, dy: dy / n, boost });
    lastMove = performance.now();
    if (!frame) {
      last = lastMove;
      frame = requestAnimationFrame(tick);
    }
  };
  addEventListener("pointermove", (e) => stir(e, 1), { passive: true });
  addEventListener("pointerdown", (e) => stir(e, 3), { passive: true });
  document.documentElement.addEventListener("pointerleave", () => {
    prev = null;
  });
}

function createScene() {
  const canvas = document.createElement("canvas");
  canvas.className = "pointer-fluid";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl2", { alpha: true, depth: false, stencil: false, antialias: false });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
  document.body.append(canvas);

  const css = getComputedStyle(document.documentElement);
  // brand tones, deepened so the smoke reads on the ivory background
  const colors = ["--brand-mist", "--brand-lilac", "--brand-sage", "--brand-sky"].map((name) => {
    const n = parseInt(css.getPropertyValue(name).trim().replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255) * 0.72);
  });

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERT);
  const program = (source: string): Program => {
    const p = gl.createProgram()!;
    gl.attachShader(p, vertex);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, source));
    gl.bindAttribLocation(p, 0, "p");
    gl.linkProgram(p);
    const set: Program["set"] = {};
    const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(p, i)!.name;
      set[name] = gl.getUniformLocation(p, name)!;
    }
    return { use: () => gl.useProgram(p), set };
  };
  const advect = program(ADVECT),
    splatter = program(SPLAT),
    curlP = program(CURL),
    vorticity = program(VORTICITY),
    divergenceP = program(DIVERGENCE),
    pressureP = program(PRESSURE),
    gradient = program(GRADIENT),
    display = program(DISPLAY);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);

  const target = (w: number, h: number): Target => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { fbo, tex, w, h };
  };
  const pair = (w: number, h: number): Pair => ({
    read: target(w, h),
    write: target(w, h),
    swap() {
      [this.read, this.write] = [this.write, this.read];
    },
  });
  const free = (t: Target) => {
    gl.deleteTexture(t.tex);
    gl.deleteFramebuffer(t.fbo);
  };

  let velocity: Pair, dye: Pair, pressure: Pair, curl: Target, divergence: Target;
  const grid = (short: number) => {
    const wide = Math.round(short * Math.max(innerWidth / innerHeight, innerHeight / innerWidth));
    return innerWidth > innerHeight ? [wide, short] : [short, wide];
  };
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    if (velocity) {
      for (const p of [velocity, dye, pressure]) {
        free(p.read);
        free(p.write);
      }
      free(curl);
      free(divergence);
    }
    const [sw, sh] = grid(128);
    const [dw, dh] = grid(512);
    velocity = pair(sw, sh);
    pressure = pair(sw, sh);
    dye = pair(dw, dh);
    curl = target(sw, sh);
    divergence = target(sw, sh);
  };
  size();
  addEventListener("resize", size);

  const bind = (slot: number, loc: WebGLUniformLocation, t: Target) => {
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.uniform1i(loc, slot);
  };
  const draw = (t: Target | null) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fbo : null);
    gl.viewport(0, 0, t ? t.w : canvas.width, t ? t.h : canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const paint = (p: Pair, x: number, y: number, color: number[], radius: number) => {
    splatter.use();
    bind(0, splatter.set.src, p.read);
    gl.uniform2f(splatter.set.point, x, y);
    gl.uniform3f(splatter.set.color, color[0], color[1], color[2]);
    gl.uniform1f(splatter.set.radius, radius);
    gl.uniform1f(splatter.set.aspect, innerWidth / innerHeight);
    draw(p.write);
    p.swap();
  };

  return {
    /** Adds force and pigment at a viewport position; dx and dy are in CSS pixels. */
    splat(x: number, y: number, dx: number, dy: number, hue: number, boost: number) {
      const at = hue * colors.length;
      const a = colors[Math.floor(at) % colors.length],
        b = colors[(Math.floor(at) + 1) % colors.length];
      const mix = at % 1;
      const u = x / innerWidth,
        v = 1 - y / innerHeight;
      const force = 26 * boost;
      paint(velocity, u, v, [(dx * velocity.read.w * force) / innerWidth, (-dy * velocity.read.h * force) / innerHeight, 0], 0.0011);
      paint(dye, u, v, a.map((c, i) => (c + (b[i] - c) * mix) * 0.42 * boost), 0.0011);
    },
    step(dt: number) {
      const w = velocity.read.w,
        h = velocity.read.h;
      const each = [curlP, vorticity, divergenceP, pressureP, gradient];
      for (const p of each) {
        p.use();
        gl.uniform2f(p.set.texel, 1 / w, 1 / h);
      }
      curlP.use();
      bind(0, curlP.set.vel, velocity.read);
      draw(curl);

      vorticity.use();
      bind(0, vorticity.set.vel, velocity.read);
      bind(1, vorticity.set.curl, curl);
      gl.uniform1f(vorticity.set.strength, 22);
      gl.uniform1f(vorticity.set.dt, dt);
      draw(velocity.write);
      velocity.swap();

      divergenceP.use();
      bind(0, divergenceP.set.vel, velocity.read);
      draw(divergence);

      pressureP.use();
      bind(1, pressureP.set.divergence, divergence);
      for (let i = 0; i < 16; i++) {
        bind(0, pressureP.set.pressure, pressure.read);
        draw(pressure.write);
        pressure.swap();
      }

      gradient.use();
      bind(0, gradient.set.pressure, pressure.read);
      bind(1, gradient.set.vel, velocity.read);
      draw(velocity.write);
      velocity.swap();

      advect.use();
      gl.uniform2f(advect.set.texel, 1 / w, 1 / h);
      gl.uniform1f(advect.set.dt, dt);
      bind(0, advect.set.vel, velocity.read);
      bind(1, advect.set.src, velocity.read);
      gl.uniform1f(advect.set.decay, 0.5);
      draw(velocity.write);
      velocity.swap();

      bind(0, advect.set.vel, velocity.read);
      bind(1, advect.set.src, dye.read);
      gl.uniform1f(advect.set.decay, 1.25);
      draw(dye.write);
      dye.swap();

      display.use();
      bind(0, display.set.dye, dye.read);
      draw(null);
    },
    /** Empties the fluid and the canvas before the loop goes to sleep. */
    clear() {
      gl.clearColor(0, 0, 0, 0);
      for (const t of [velocity.read, dye.read, pressure.read]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
  };
}
