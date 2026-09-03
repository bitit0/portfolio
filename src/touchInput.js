/**
 * Shared virtual input for on-screen touch controls.
 *
 * The floating joystick writes a movement vector here and the player reads it
 * each frame, exactly alongside the keyboard — so touch support is additive and
 * the movement code never has to know where the input came from. The interact
 * button fires a callback the interaction system registers.
 */

let moveX = 0; // -1..1, right positive
let moveY = 0; // -1..1, down positive

/** @type {Set<() => void>} */
const interactListeners = new Set();

/** @param {number} x @param {number} y */
export function setMove(x, y) {
  moveX = x;
  moveY = y;
}

export function clearMove() {
  moveX = 0;
  moveY = 0;
}

export function getMove() {
  return { x: moveX, y: moveY };
}

/** Register a handler for the on-screen interact button. Returns an unsubscribe. */
export function onVirtualInteract(fn) {
  interactListeners.add(fn);
  return () => interactListeners.delete(fn);
}

export function fireInteract() {
  for (const fn of interactListeners) fn();
}
