import kaplay from "kaplay";

/**
 * The one shared Kaplay context. No width/letterbox on purpose: the canvas
 * renders at native resolution and src/camera.js zooms to fit (a low-res
 * framebuffer made text unreadable). `global: false` keeps helpers off `window`.
 */
const k = kaplay({
  canvas: /** @type {HTMLCanvasElement} */ (document.getElementById("game")),
  crisp: true,
  global: false,
  background: [22, 26, 34],
  pixelDensity: window.devicePixelRatio || 1, // true device resolution on HiDPI
  debugKey: "f1",
});

// Dev-only console handle — WebGL canvases don't screenshot, so this is how you
// inspect the running game. Stripped from production.
if (import.meta.env.DEV) {
  /** @type {any} */ (window).__k = k;
}

export default k;
