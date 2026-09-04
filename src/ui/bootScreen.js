/**
 * Boot / title screen: a full field of random "hacker" characters. The outer
 * characters fade first and the fade closes inward, leaving only the characters
 * that fall inside the letters of the name — so the code collapses into
 * "Nathan Ngo" spelled out of the same glyphs, then a "click to continue".
 *
 * The name is a mask: cells whose centre lands inside the rendered name persist
 * (and keep flickering); every other cell fades as the reveal front sweeps from
 * the edges to the centre. Mounted before assets load, so it also masks the
 * blank-canvas moment on first paint.
 *
 * Any click or key press dismisses it. Respects prefers-reduced-motion by
 * drawing the final card immediately with no animation.
 */

const CELL_W = 13; // px per glyph column
const CELL_H = 17; // px per glyph row
const REVEAL_MS = 2600; // time for the field to collapse into the name
const EDGE = 0.08; // how long an individual character takes to fade out
const JITTER = 0.18; // per-cell randomness in fade timing (ragged, not a clean ring)
const REROLL = 0.12; // chance per cell per frame to change its glyph (flicker)
const CHARS = "01<>[]{}()/\\|=+*#$%&!?ABCDEF0123456789abcdef";

const randChar = () => CHARS[(Math.random() * CHARS.length) | 0];

export function mountBootScreen() {
  const boot = document.createElement("div");
  boot.id = "bootscreen";
  boot.setAttribute("aria-hidden", "true");
  boot.innerHTML = `<canvas class="boot-noise"></canvas>`;
  document.body.append(boot);

  const canvas = /** @type {HTMLCanvasElement} */ (boot.querySelector(".boot-noise"));
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));

  let raf = 0;
  let dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("keydown", dismiss);
    boot.classList.add("boot-out");
    boot.addEventListener("transitionend", () => boot.remove(), { once: true });
    setTimeout(() => boot.remove(), 800); // belt-and-braces if no transitionend
    document.getElementById("game")?.focus();
  }
  boot.addEventListener("pointerdown", dismiss);
  window.addEventListener("keydown", dismiss);

  let cols = 0;
  let rows = 0;
  /** @type {Float32Array} */ let dist; // normalized distance from centre, per cell
  /** @type {Float32Array} */ let jitter; // per-cell fade-timing offset
  /** @type {Uint8Array} */ let isName; // 1 where the cell is inside the name
  /** @type {string[]} */ let glyphs;

  function resize() {
    const W = (canvas.width = Math.max(1, window.innerWidth));
    const H = (canvas.height = Math.max(1, window.innerHeight));
    cols = Math.max(1, Math.ceil(W / CELL_W));
    rows = Math.max(1, Math.ceil(H / CELL_H));

    // Render the name to an offscreen mask, sized to fit, to learn which cells
    // sit inside its letters.
    const mask = document.createElement("canvas");
    mask.width = W;
    mask.height = H;
    const mctx = /** @type {CanvasRenderingContext2D} */ (mask.getContext("2d"));
    mctx.fillStyle = "#fff";
    mctx.textAlign = "center";
    mctx.textBaseline = "middle";
    let size = Math.min(W * 0.11, H * 0.17);
    mctx.font = `bold ${size}px "Segoe UI", system-ui, sans-serif`;
    const measured = mctx.measureText("Nathan Ngo").width;
    if (measured > W * 0.9) {
      size *= (W * 0.9) / measured;
      mctx.font = `bold ${size}px "Segoe UI", system-ui, sans-serif`;
    }
    mctx.fillText("Nathan Ngo", W / 2, H / 2);
    const alpha = mctx.getImageData(0, 0, W, H).data;

    dist = new Float32Array(cols * rows);
    jitter = new Float32Array(cols * rows);
    isName = new Uint8Array(cols * rows);
    glyphs = new Array(cols * rows);
    const cx = cols / 2;
    const cy = rows / 2;
    const maxD = Math.hypot(cx, cy) || 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        dist[i] = Math.hypot(c - cx, r - cy) / maxD;
        jitter[i] = (Math.random() * 2 - 1) * JITTER;
        glyphs[i] = randChar();
        const px = Math.min(W - 1, (c * CELL_W + CELL_W / 2) | 0);
        const py = Math.min(H - 1, (r * CELL_H + CELL_H / 2) | 0);
        isName[i] = alpha[(py * W + px) * 4 + 3] > 128 ? 1 : 0;
      }
    }
    ctx.font = `${CELL_H - 3}px "DejaVu Sans Mono", ui-monospace, monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
  }

  resize();
  window.addEventListener("resize", resize);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Draws one frame at reveal progress p (0..1). */
  function draw(p, now) {
    // Sweep the fade front from beyond the raggedest edge to past the centre,
    // so at p=0 every character is lit and by p=1 all non-name cells are gone
    // even with the jitter pushing some fade points outside the [0,1] range.
    const front = 1 + JITTER + EDGE - p * (1 + 2 * JITTER + EDGE);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Name characters brighten from the field green (46,160,67) toward the
    // "click to continue" green #39d353 (57,211,83) as the reveal proceeds, so
    // the name "develops" and lands on the same colour as the prompt.
    const nameColor = `rgb(${(46 + 11 * p) | 0}, ${(160 + 51 * p) | 0}, ${(67 + 16 * p) | 0})`;
    for (let i = 0, n = cols * rows; i < n; i++) {
      // Name cells persist; everything else fades once the front passes it.
      // The per-cell jitter ragged-ens the front so characters dissolve
      // individually rather than along a clean ring.
      const a = isName[i] ? 1 : clamp((front - (dist[i] + jitter[i])) / EDGE, 0, 1);
      if (a <= 0) continue;
      if (Math.random() < REROLL) glyphs[i] = randChar();
      ctx.globalAlpha = a;
      // Name cells share the field's glyphs; they start the same green and
      // brighten over the reveal, while the field keeps the occasional bright glyph.
      ctx.fillStyle = isName[i] ? nameColor : Math.random() < 0.03 ? "#c8ffd8" : "#2ea043";
      const c = i % cols;
      const r = (i / cols) | 0;
      ctx.fillText(glyphs[i], c * CELL_W + 1, r * CELL_H + 1);
    }
    ctx.globalAlpha = 1;
    if (p >= 1) drawHint(now);
  }

  function drawHint(now) {
    const pulse = reduce ? 0.85 : 0.55 + 0.45 * Math.sin(now / 400);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#39d353";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${Math.max(13, Math.round(canvas.height * 0.026))}px "DejaVu Sans Mono", monospace`;
    ctx.fillText("Click to continue", canvas.width / 2, canvas.height * 0.66);
    // Restore the grid-drawing text settings for the next frame.
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `${CELL_H - 3}px "DejaVu Sans Mono", ui-monospace, monospace`;
  }

  if (reduce) {
    draw(1, 0); // final card, no animation
    return;
  }

  let start = 0;
  function frame(now) {
    if (dismissed) return;
    if (!start) start = now;
    const p = Math.min(1, (now - start) / REVEAL_MS);
    draw(p, now);
    raf = requestAnimationFrame(frame); // keep running so the name flickers
  }
  raf = requestAnimationFrame(frame);
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
