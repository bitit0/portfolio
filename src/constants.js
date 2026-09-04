/**
 * Tunables. Only knobs live here; values a single module owns (GID bit flags,
 * spritesheet layout, asset paths) stay next to that code.
 */

/** Map tile size, in world units. */
export const TILE_SIZE = 16;

// --- Movement ---------------------------------------------------------------

/** Walk speed, world units per second. */
export const PLAYER_SPEED = 68;

/** Speed multiplier while a run key is held. */
export const RUN_MULTIPLIER = 2;

export const RUN_KEYS = ["shift"];

/** Movement keys → unit direction. `dir` also names the animation, so it must
 *  stay one of down/up/left/right (see src/assets.js). */
export const MOVE_KEYS = [
  { keys: ["left", "a"], vec: [-1, 0], dir: "left" },
  { keys: ["right", "d"], vec: [1, 0], dir: "right" },
  { keys: ["up", "w"], vec: [0, -1], dir: "up" },
  { keys: ["down", "s"], vec: [0, 1], dir: "down" },
];

/** Collider size vs sprite frame; below 1 so transparent padding doesn't snag. */
export const PLAYER_COLLIDER_SCALE = 0.7;

// --- Interaction ------------------------------------------------------------

/** Examine keys (kaplay names). The DOM dialogue mirrors these below — change
 *  one, change the other. */
export const INTERACT_KEYS = ["f", "space", "enter"];

/** The same keys as the DOM spells them (" " not "space", case-sensitive),
 *  derived so the two lists can't drift apart. */
export const INTERACT_KEYS_DOM = INTERACT_KEYS.flatMap((key) => {
  if (key === "space") return [" "];
  if (key === "enter") return ["Enter"];
  if (key.length === 1) return [key.toLowerCase(), key.toUpperCase()];
  return [key];
});

/** How the interact key is written in prompts. */
export const INTERACT_KEY_LABEL = INTERACT_KEYS[0].toUpperCase();

/** Examine range, player centre to nearest edge of the object's rect. */
export const INTERACT_RADIUS = 12;

/** How far an object's trigger extends below its sprite, so wall-mounted things
 *  are reachable from the floor. */
export const INTERACT_REACH_DOWN = 12;

/** Grace period after an overlay closes, so the dismiss key doesn't reopen it. */
export const INTERACT_COOLDOWN_MS = 220;

// --- UI ---------------------------------------------------------------------

/** UI text sizes in screen pixels (drawn fixed(), so camera zoom can't blur them). */
export const UI_PROMPT_SIZE = 16;
export const UI_HINT_SIZE = 14;

/** Dialogue typewriter speed, characters per second. */
export const DIALOGUE_CHARS_PER_SECOND = 55;

// --- Draw order -------------------------------------------------------------

/** Layer stack. Furniture and the player sort dynamically by bottom edge
 *  (~50–200 here), so anything fixed above/below them must clear that band. */
export const Z = {
  TILES: -1000, // tile layers, offset by map index
  OUTLINE: -900, // hand-placed outline strips
  ABOVE: 5000, // tile layer "above", drawn over the player (wall tops, decor)
  PROMPT: 9000, // the "F · Thing" bubble
  HINT: 9500, // controls hint along the bottom
};
