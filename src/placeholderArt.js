/** Fallback fills for any object whose sprite is missing, so the room stays
 *  playable. Keyed by object name in public/assets/map.json. */

/** @type {Record<string, [number, number, number]>} */
export const OBJECT_COLORS = {
  computer: [72, 112, 176],
  poster: [188, 84, 140],
  tv: [56, 58, 74],
  window: [124, 190, 220],
  shelf: [150, 102, 60],
  stairs: [108, 110, 124],
  bed: [198, 88, 100],
  plant: [80, 152, 92],
  mailbox: [190, 170, 92],
};

export const FALLBACK_COLOR = /** @type {[number, number, number]} */ ([140, 140, 150]);
