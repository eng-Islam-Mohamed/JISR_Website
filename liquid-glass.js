/* Native WebGL sculpture and DOM glass controls. Content never depends on these effects. */
(() => {
  const root = document.documentElement;
  document.querySelector("meta[name=theme-color]").content = getComputedStyle(
    root,
  )
    .getPropertyValue("--brand-ivory")
    .trim();
  const reduced = () =>
    root.dataset.motion === "reduced" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.querySelector(".crystal-scene");
  const stage = document.querySelector(".hero-stage");
  const nav = document.querySelector(".main-nav");
  const lens = nav.querySelector(".nav-lens");
  const links = [...nav.querySelectorAll("a")];
  let selectedLink = links[0];
  let lensAnimation;

  function positionLens(link, immediate = false) {
    const bounds = nav.getBoundingClientRect();
    const target = link.getBoundingClientRect();
    if (!bounds.width) return;
    const next = { x: target.left - bounds.left, width: target.width };
    const previous = lens.getBoundingClientRect();
    lens.style.width = `${next.width}px`;
    lens.style.transform = `translateX(${next.x}px)`;
    lensAnimation?.cancel();
    if (!immediate && !reduced() && previous.width) {
      lensAnimation = lens.animate(
        [
          {
            transform: `translateX(${previous.left - bounds.left}px) scaleX(1)`,
          },
          { transform: `translateX(${next.x}px) scaleX(1.12)`, offset: 0.65 },
          { transform: `translateX(${next.x}px) scaleX(1)` },
        ],
        {
          duration: parseFloat(
            getComputedStyle(root).getPropertyValue("--motion-reveal"),
          ),
          easing: getComputedStyle(root).getPropertyValue("--motion-ease").trim(),
        },
      );
    }
  }
  links.forEach((link) => {
    link.addEventListener("pointerenter", () => positionLens(link));
    link.addEventListener("focus", () => positionLens(link));
    link.addEventListener("click", () => {
      selectedLink = link;
      links.forEach((a) => a.toggleAttribute("data-current", a === link));
      positionLens(link);
    });
  });
  nav.addEventListener("pointerleave", () => positionLens(selectedLink));
  nav.addEventListener("focusout", (event) => {
    if (!nav.contains(event.relatedTarget)) positionLens(selectedLink);
  });
  new ResizeObserver(() => positionLens(selectedLink, true)).observe(nav);
  document.fonts.ready.then(() => positionLens(selectedLink, true));

  // Highlights follow the light source only while the pointer is inside a surface.
  document
    .querySelectorAll(".glass,.speak-button,.demo-choice,.download-button")
    .forEach((surface) => {
      let frame;
      surface.addEventListener("pointermove", (event) => {
        if (reduced() || event.pointerType !== "mouse") return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const bounds = surface.getBoundingClientRect();
          surface.style.setProperty(
            "--light-x",
            `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
          );
          surface.style.setProperty(
            "--light-y",
            `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
          );
        });
      });
      surface.addEventListener("pointerleave", () => {
        cancelAnimationFrame(frame);
        surface.style.removeProperty("--light-x");
        surface.style.removeProperty("--light-y");
      });
    });

  async function mountSculpture() {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      stage.dataset.renderer = "fallback";
      return;
    }
    const shaderPaths = [
      "assets/shaders/bridge.vert",
      "assets/shaders/bridge.frag",
    ];
    const sources = await Promise.all(
      shaderPaths.map(async (path) => {
        const response = await fetch(path);
        if (!response.ok) throw Error("Glass shader unavailable");
        return response.text();
      }),
    );
    let program;
    let vertexBuffer;
    let uniforms;
    let frame;
    let pointer = [0, 0];
    let target = [0, 0];
    let visible = true;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw Error("Glass shader compilation failed");
      }
      return shader;
    }
    function initialize() {
      program = gl.createProgram();
      const vertex = compile(gl.VERTEX_SHADER, sources[0]);
      const fragment = compile(gl.FRAGMENT_SHADER, sources[1]);
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw Error("Glass shader linking failed");
      gl.useProgram(program);
      vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const location = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      uniforms = Object.fromEntries(
        ["resolution", "pointer", "ivory", "sky", "mist", "lilac", "ink"].map(
          (name) => [name, gl.getUniformLocation(program, name)],
        ),
      );
      const styles = getComputedStyle(root);
      for (const name of ["ivory", "sky", "mist", "lilac", "ink"]) {
        const value = styles
          .getPropertyValue(name === "ink" ? "--color-ink" : `--brand-${name}`)
          .trim();
        const rgb = value.match(/^#([\da-f]{6})$/i)?.[1];
        if (!rgb) throw Error("Missing glass color token");
        gl.uniform3fv(
          uniforms[name],
          [0, 2, 4].map(
            (offset) => parseInt(rgb.slice(offset, offset + 2), 16) / 255,
          ),
        );
      }
      stage.dataset.renderer = "webgl";
      draw(true);
    }
    function draw(resize = false) {
      if (gl.isContextLost() || document.hidden || !visible) return;
      if (resize) {
        const bounds = canvas.getBoundingClientRect();
        // Cap the back buffer, especially on high-DPI phones. No idle animation loop.
        const ratio = Math.min(
          devicePixelRatio || 1,
          innerWidth < 640 ? 1 : 1.5,
        );
        canvas.width = Math.max(1, Math.round(bounds.width * ratio));
        canvas.height = Math.max(1, Math.round(bounds.height * ratio));
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2fv(uniforms.pointer, pointer);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      canvas.dataset.drawn = "true";
    }
    function settle() {
      frame = null;
      if (reduced()) {
        pointer = [0, 0];
        draw();
        return;
      }
      pointer = pointer.map(
        (value, index) => value + (target[index] - value) * 0.16,
      );
      draw();
      if (
        Math.abs(pointer[0] - target[0]) + Math.abs(pointer[1] - target[1]) >
        0.004
      )
        frame = requestAnimationFrame(settle);
    }
    stage.addEventListener("pointermove", (event) => {
      if (reduced() || event.pointerType !== "mouse") return;
      const bounds = stage.getBoundingClientRect();
      target = [
        (event.clientX - bounds.left) / bounds.width - 0.5,
        (event.clientY - bounds.top) / bounds.height - 0.5,
      ];
      if (!frame) frame = requestAnimationFrame(settle);
    });
    stage.addEventListener("pointerleave", () => {
      target = [0, 0];
      if (!frame) frame = requestAnimationFrame(settle);
    });
    new ResizeObserver(() => draw(true)).observe(canvas);
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) draw(true);
      },
      { rootMargin: "10%" },
    ).observe(canvas);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) draw(true);
    });
    new MutationObserver(() => {
      if (reduced()) {
        cancelAnimationFrame(frame);
        frame = null;
        pointer = [0, 0];
        target = [0, 0];
        lensAnimation?.cancel();
        draw();
      }
    }).observe(root, { attributes: true, attributeFilter: ["data-motion"] });
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = null;
      stage.dataset.renderer = "fallback";
    });
    canvas.addEventListener("webglcontextrestored", () => {
      try {
        initialize();
      } catch {
        stage.dataset.renderer = "fallback";
      }
    });
    initialize();
  }
  mountSculpture().catch(() => {
    stage.dataset.renderer = "fallback";
  });
})();
