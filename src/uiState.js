import { INTERACT_COOLDOWN_MS } from "./constants.js";

/**
 * Tracks which DOM overlays are open on top of the canvas.
 *
 * This is the single guard that stops the player walking around while you are
 * reading a dialogue or browsing the in-game computer. Every input handler in
 * the game checks `isUIOpen()` before doing anything.
 *
 * Layers form a stack so Escape always closes the topmost thing.
 * @typedef {{ name: string, close: () => void }} Layer
 */

/** @type {Layer[]} */
const stack = [];
let lastCloseAt = 0;

/**
 * Keeps kaplay's key state honest while an overlay has focus.
 *
 * Overlays blur the canvas so typing goes to the DOM, but kaplay listens on the
 * canvas — so a key released while an overlay is open never reaches it and stays
 * stuck "down". The player then bolts off the moment the overlay closes, still
 * obeying a key the user let go of.
 *
 * Forwarding just the releases fixes that: hold a key through a dialogue and you
 * keep walking afterwards, let go and you stop, which is what both cases should
 * do. keydown is deliberately not forwarded — the player is frozen anyway, and
 * replaying presses could re-trigger interact handlers.
 */
function forwardKeyUp(e) {
  const canvas = document.getElementById("game");
  if (!canvas || e.target === canvas) return;
  canvas.dispatchEvent(
    // bubbles: false, or this would come straight back to the window listener.
    new KeyboardEvent("keyup", { key: e.key, code: e.code, bubbles: false }),
  );
}

function syncCanvasKeys(active) {
  if (active) window.addEventListener("keyup", forwardKeyUp, true);
  else window.removeEventListener("keyup", forwardKeyUp, true);
}

export function isUIOpen() {
  return stack.length > 0;
}

/**
 * True briefly after an overlay closes. Interact handlers ignore presses during
 * this window so the dismiss keypress does not re-trigger the object.
 */
export function isInteractCoolingDown() {
  return performance.now() - lastCloseAt < INTERACT_COOLDOWN_MS;
}

/** @param {Layer} layer */
export function pushLayer(layer) {
  const wasClosed = stack.length === 0;
  stack.push(layer);
  if (wasClosed) syncCanvasKeys(true);
}

/** Removes the topmost layer and starts the interact cooldown. */
export function popLayer() {
  const layer = stack.pop();
  lastCloseAt = performance.now();
  if (stack.length === 0) syncCanvasKeys(false);
  return layer;
}

/** @returns {Layer | undefined} */
export function topLayer() {
  return stack[stack.length - 1];
}

/** Closes the topmost overlay, if any. Returns whether anything was closed. */
export function closeTopLayer() {
  const layer = topLayer();
  if (!layer) return false;
  layer.close();
  return true;
}

// Escape is handled once, globally, rather than per-overlay — otherwise nested
// overlays each register a listener and a single press closes all of them.
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !isUIOpen()) return;
  e.preventDefault();
  closeTopLayer();
});
