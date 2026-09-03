/**
 * Tunables — the things you are likely to want to change.
 *
 * Deliberately only holds knobs, not implementation details. Values that a
 * single module owns (Tiled's GID bit flags, the spritesheet's column layout,
 * asset paths) stay next to the code that understands them; hoisting those here
 * would just put them further from their meaning.
 */

/** Size of one map tile, in world units. The map declares its own dimensions. */
export const TILE_SIZE = 16;

// --- Movement ---------------------------------------------------------------

/** Player walk speed, in world units per second. */
export const PLAYER_SPEED = 68;

/** Speed multiplier while a run key is held. */
export const RUN_MULTIPLIER = 2;

/** Keys that make the player run. */
export const RUN_KEYS = ["shift"];

/**
 * Movement keys, mapped to a unit direction. kaplay key names.
 *
 * `dir` also selects the walk/idle animation, so it must stay one of
 * down / up / left / right — those are the names registered in src/assets.js.
 */
export const MOVE_KEYS = [
  { keys: ["left", "a"], vec: [-1, 0], dir: "left" },
  { keys: ["right", "d"], vec: [1, 0], dir: "right" },
  { keys: ["up", "w"], vec: [0, -1], dir: "up" },
  { keys: ["down", "s"], vec: [0, 1], dir: "down" },
];

/**
 * Player collider size relative to the sprite frame.
 *
 * Below 1 because the art has transparent padding and a tight box stops the
 * player snagging on doorways.
 */
export const PLAYER_COLLIDER_SCALE = 0.7;

// --- Interaction ------------------------------------------------------------

/**
 * Keys that examine whatever the player is standing next to.
 *
 * These are kaplay key names, used for the in-world prompt. The dialogue box is
 * DOM and listens for browser key names in src/ui/dialogue.js — change one and
 * the other probably wants changing too.
 */
export const INTERACT_KEYS = ["f", "space", "enter"];

/**
 * The same keys spelled the way the DOM spells them, for the dialogue box.
 *
 * Derived rather than written twice: the canvas and the DOM disagree on names
 * (" " vs "space", and the DOM is case-sensitive), and keeping two hand-written
 * lists in step is exactly how you end up opening a dialogue with one key and
 * being unable to advance it with the same one.
 */
export const INTERACT_KEYS_DOM = INTERACT_KEYS.flatMap((key) => {
  if (key === "space") return [" "];
  if (key === "enter") return ["Enter"];
  if (key.length === 1) return [key.toLowerCase(), key.toUpperCase()];
  return [key];
});

/** How the interact key is written in prompts and the controls hint. */
export const INTERACT_KEY_LABEL = INTERACT_KEYS[0].toUpperCase();

/**
 * How close the player must be to an object to examine it, measured from the
 * player's centre to the nearest point on the object's rect (not centre to
 * centre — furniture footprints vary a lot in size).
 */
export const INTERACT_RADIUS = 12;

/**
 * How far an object's trigger zone extends BELOW its sprite, in world units.
 *
 * Wall-mounted things (window, terminal) sit high up where the player can never
 * stand, so proximity to the sprite alone is unreachable. Extending the trigger
 * downward toward the floor means "stand below it and press F" works, while the
 * small radius keeps unrelated objects from firing.
 */
export const INTERACT_REACH_DOWN = 12;

/**
 * Grace period after any overlay closes before an interact press registers
 * again. Without it, the key that dismisses a dialogue immediately reopens it.
 */
export const INTERACT_COOLDOWN_MS = 220;

// --- UI ---------------------------------------------------------------------

/**
 * UI text sizes, in SCREEN pixels, not world units. UI is drawn with fixed(),
 * so it ignores the camera zoom and stays sharp at any window size.
 */
export const UI_PROMPT_SIZE = 16;
export const UI_HINT_SIZE = 14;

/** Dialogue typewriter speed, characters per second. */
export const DIALOGUE_CHARS_PER_SECOND = 55;

// --- Draw order -------------------------------------------------------------

/**
 * The layer stack, lowest first. Everything drawn sorts on these.
 *
 * Gathered in one place because they only make sense relative to each other:
 * the room's furniture and the player sort dynamically by their bottom edge
 * (roughly 50–200 in this map), so anything meant to sit reliably above or
 * below them has to clear that band.
 */
export const Z = {
  /** Tile layers, offset by their index in the map file. */
  TILES: -1000,
  /** Hand-placed room outline strips. */
  OUTLINE: -900,
  /** Tile layer named "above" — draws over the player, for wall tops and decor. */
  ABOVE: 5000,
  /** The "F · Thing" bubble. */
  PROMPT: 9000,
  /** The controls hint along the bottom. */
  HINT: 9500,
};
