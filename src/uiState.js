import { INTERACT_COOLDOWN_MS } from "./constants.js";

/**
 * The stack of open DOM overlays — the single guard that freezes the player
 * while a dialogue or the computer is open (every input handler checks
 * isUIOpen()). A stack, so Escape closes the topmost thing.
 * @typedef {{ name: string, close: () => void }} Layer
 */

/** @type {Layer[]} */
const stack = [];
let lastCloseAt = 0;

/**
 * While an overlay has focus a key release reaches the DOM, not the canvas
 * kaplay listens on, so it stays stuck "down" and the player bolts on close.
 * Forwarding just the releases fixes it; keydown is left alone (the player is
 * frozen, and replaying presses could re-trigger interact handlers).
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

/** True briefly after an overlay closes, so the dismiss key doesn't re-fire the object. */
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

// Escape handled once globally, so one press doesn't close every nested overlay.
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !isUIOpen()) return;
  e.preventDefault();
  closeTopLayer();
});
