import kaplay from "kaplay";

/**
 * The shared Kaplay context. Imported by every module that needs to touch the
 * game — created once here so scenes and entities agree on one instance.
 *
 * Deliberately NO width/height/stretch/letterbox: the canvas renders at the
 * window's native resolution and src/camera.js zooms the room to fit. Pinning a
 * 320x240 framebuffer and upscaling it is what made canvas text unreadable.
 *
 * `global: false` keeps kaplay's helpers off `window`, so everything is an
 * explicit `k.` call and nothing collides with the DOM overlay code.
 */
const k = kaplay({
  canvas: /** @type {HTMLCanvasElement} */ (document.getElementById("game")),
  crisp: true,
  global: false,
  background: [22, 26, 34],
  // Match the display so text is rendered at true device resolution rather
  // than being upscaled by the browser on HiDPI screens.
  pixelDensity: window.devicePixelRatio || 1,
  debugKey: "f1",
});

// Dev-only handle. WebGL canvases do not show up in most screenshot tools, so
// having the context reachable from the console is the difference between
// debugging the game and guessing at it. Stripped from production builds.
if (import.meta.env.DEV) {
  /** @type {any} */ (window).__k = k;
}

export default k;
