import k from "../kaplayCtx.js";
import {
  INTERACT_RADIUS,
  INTERACT_REACH_DOWN,
  UI_PROMPT_SIZE,
  INTERACT_KEYS,
  INTERACT_KEY_LABEL,
  Z,
} from "../constants.js";
import { OBJECT_COLORS, FALLBACK_COLOR } from "../placeholderArt.js";
import { DIALOGUE } from "../content.js";
import { spriteForGid } from "../assets.js";
import { isUIOpen, isInteractCoolingDown } from "../uiState.js";
import { onVirtualInteract } from "../touchInput.js";
import { playClick } from "../sfx.js";
import { openDialogue } from "../ui/dialogue.js";
import { openDesktop } from "../ui/desktop/index.js";

/**
 * @typedef {object} MapObject
 * @property {string} name
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 */

/**
 * Builds one furniture entity from a map rect — the same rect drives the
 * collider, the sprite/placeholder and the proximity check.
 * @param {MapObject} obj
 */
export function makeInteractable(obj, map) {
  const entry = DIALOGUE[obj.name];

  // Having a DIALOGUE entry is what makes something examinable; everything else
  // is silent scenery. An "interactive" property in Tiled overrides either way.
  const declared = objectProperty(obj, "interactive", undefined);
  const interactive = declared === undefined ? Boolean(entry) : Boolean(declared);

  if (interactive && !entry) {
    console.warn(
      `[room] "${obj.name || "(unnamed)"}" is marked interactive but has no DIALOGUE entry in src/content.js`,
    );
  }

  // Tile objects (gid) are anchored bottom-left, unlike plain rects (top-left),
  // so lift the draw origin by the height.
  const sprite = obj.gid ? spriteForGid(map, obj.gid) : null;
  const top = obj.gid ? obj.y - obj.height : obj.y;

  const visual = sprite
    ? [k.sprite(sprite)]
    : [
        k.rect(obj.width, obj.height, { radius: 2 }),
        k.color(...(OBJECT_COLORS[obj.name] ?? FALLBACK_COLOR)),
        k.outline(1, k.rgb(28, 24, 38)),
      ];

  if (obj.gid && !sprite) {
    console.warn(`[room] object "${obj.name}" has gid ${obj.gid} but no matching image`);
  }

  return k.add([
    ...visual,
    k.pos(obj.x, top),
    k.anchor("topleft"),
    k.area(),
    k.body({ isStatic: true }),
    // Depth is the bottom edge; a "zBias" Tiled property lifts things stacked on
    // others (a computer on a desk) above what they sit on.
    k.z(top + obj.height + objectProperty(obj, "zBias", 0)),
    ...(interactive ? ["interactable"] : ["scenery"]),
    {
      key: obj.name,
      label: entry?.label ?? obj.name,
      rect: {
        x: obj.x,
        y: top,
        w: obj.width,
        h: obj.height,
        reachDown: objectProperty(obj, "reachDown", undefined),
      },
    },
  ]);
}

/** Reads a Tiled custom property (`properties: [{ name, value }]`) off an object. */
function objectProperty(obj, name, fallback) {
  const found = obj.properties?.find((p) => p.name === name);
  return found === undefined ? fallback : found.value;
}

/** Shortest distance from a point to a rect (0 inside). Centre-to-centre would
 *  be useless — footprints vary too much in size. */
function distanceToRect(px, py, r) {
  // Trigger extends below the sprite so wall-mounted things are reachable from
  // the floor; per-object `reachDown` overrides the default.
  const bottom = r.y + r.h + (r.reachDown ?? INTERACT_REACH_DOWN);
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - bottom);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * The "nearest object shows a prompt, F examines it" loop. One prompt at a time,
 * rebuilt when the target changes (rare, so cheaper than syncing it every frame).
 * @param {ReturnType<import("./player.js").makePlayer>} player
 */
export function setupInteractionSystem(player) {
  let currentTarget = null;
  let promptObj = null;
  /** World point the prompt hovers above, re-projected to screen each frame. */
  let promptAnchor = null;

  // Examined objects; their hint arrow retires, so the arrows double as progress.
  const examined = new Set();

  // A bobbing arrow over every interactable. fixed() + toScreen keeps it a
  // constant screen size regardless of camera zoom.
  const arrows = k.get("interactable").map((obj) => {
    const anchor = k.vec2(obj.rect.x + obj.rect.w / 2, obj.rect.y - 3);
    const arrow = k.add([
      // Golden downward chevron; polygon supplies its own anchor (adding
      // k.anchor() collides and throws).
      k.polygon([k.vec2(-6, -8), k.vec2(6, -8), k.vec2(0, 0)]),
      k.color(240, 198, 92),
      k.outline(1, k.rgb(40, 30, 12)),
      k.pos(k.toScreen(anchor)),
      k.fixed(),
      k.z(Z.PROMPT - 10),
      "hint",
      { key: obj.key, anchor },
    ]);
    return arrow;
  });

  function clearPrompt() {
    if (promptObj) k.destroy(promptObj);
    promptObj = null;
    promptAnchor = null;
    currentTarget = null;
  }

  function showPrompt(target) {
    clearPrompt();
    currentTarget = target;

    const label = `${INTERACT_KEY_LABEL} · ${target.label}`;
    // fixed() → screen pixels, so the prompt stays sharp at any zoom.
    const height = UI_PROMPT_SIZE + 10;
    const width = label.length * UI_PROMPT_SIZE * 0.6 + UI_PROMPT_SIZE;

    promptAnchor = k.vec2(target.rect.x + target.rect.w / 2, target.rect.y - 4);

    promptObj = k.add([
      k.rect(width, height, { radius: 4 }),
      k.color(22, 20, 32),
      k.outline(2, k.rgb(236, 232, 246)),
      k.pos(k.toScreen(promptAnchor)),
      k.anchor("bot"),
      k.fixed(),
      k.z(Z.PROMPT),
      "prompt",
    ]);
    promptObj.add([
      k.text(label, { size: UI_PROMPT_SIZE }),
      k.color(236, 232, 246),
      k.pos(0, -height / 2),
      k.anchor("center"),
    ]);
  }

  function updateArrows(hideAll) {
    const bob = Math.sin(k.time() * 4) * 2;
    for (const arrow of arrows) {
      // Hidden under an overlay, once examined, or when it's the current target.
      arrow.hidden =
        hideAll || examined.has(arrow.key) || (currentTarget && currentTarget.key === arrow.key);
      // Re-project so the fixed-size arrow tracks the object through resizes.
      const s = k.toScreen(arrow.anchor);
      arrow.pos = k.vec2(s.x, s.y + bob);
    }
  }

  k.onUpdate(() => {
    if (isUIOpen()) {
      if (promptObj) promptObj.hidden = true; // don't show through an overlay
      updateArrows(true);
      return;
    }
    if (promptObj) promptObj.hidden = false;
    updateArrows(false);

    // Re-project the screen-space prompt from its world anchor each frame.
    if (promptObj && promptAnchor) promptObj.pos = k.toScreen(promptAnchor);

    let nearest = null;
    let nearestDist = Infinity;
    for (const obj of k.get("interactable")) {
      const dist = distanceToRect(player.pos.x, player.pos.y, obj.rect);
      if (dist < nearestDist) {
        nearest = obj;
        nearestDist = dist;
      }
    }

    if (!nearest || nearestDist > INTERACT_RADIUS) {
      if (currentTarget) clearPrompt();
      return;
    }
    if (nearest !== currentTarget) showPrompt(nearest);
  });

  const interact = () => {
    if (!currentTarget || isUIOpen() || isInteractCoolingDown()) return;
    playClick();
    examined.add(currentTarget.key); // retire its hint arrow

    if (currentTarget.key === "computer") {
      openDesktop();
      return;
    }

    const entry = DIALOGUE[currentTarget.key];
    if (entry) openDialogue(entry);
  };

  for (const key of INTERACT_KEYS) k.onKeyPress(key, interact);
  onVirtualInteract(interact); // on-screen interact button (touch)
}
