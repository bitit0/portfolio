import k from "./kaplayCtx.js";
import { collectionSpriteName } from "./assets.js";
import { Z } from "./constants.js";

/**
 * Draws room outlines from the "outline" object layer: a plain rectangle named
 * top/bottom/left/right is filled by repeating the matching 16px strip along its
 * length. Thickness is the sprite's; only the rectangle's length matters.
 */

const KINDS = ["top", "bottom", "left", "right"];
const VERTICAL = new Set(["left", "right"]);

/** Painted cells of the room, used to work out which side of a strip is outside. */
function paintedMask(map) {
  const mask = new Uint8Array(map.width * map.height);
  for (const layer of map.layers) {
    if (layer.type !== "tilelayer" || !Array.isArray(layer.data)) continue;
    if (layer.name === "above") continue;
    for (let i = 0; i < layer.data.length; i++) if (layer.data[i]) mask[i] = 1;
  }
  return mask;
}

/** Which strip a rectangle wants. An explicit name wins; otherwise sample the
 *  painted cells on each side and face the dark edge toward the empty (outside) one. */
function kindOf(obj, map, mask) {
  const label = `${obj.name ?? ""} ${obj.type ?? obj.class ?? ""}`.toLowerCase();
  const named = KINDS.find((kind) => label.includes(kind));
  if (named) return named;

  const T = map.tilewidth;
  const vertical = obj.height > obj.width;
  const solidAt = (px, py) => {
    const c = Math.floor(px / T);
    const r = Math.floor(py / map.tileheight);
    if (c < 0 || r < 0 || c >= map.width || r >= map.height) return false;
    return mask[r * map.width + c] === 1;
  };

  // Sample along the rectangle so one stray cell cannot swing the result.
  let sideA = 0;
  let sideB = 0;
  const STEPS = 5;
  for (let i = 0; i < STEPS; i++) {
    const t = (i + 0.5) / STEPS;
    if (vertical) {
      const py = obj.y + obj.height * t;
      if (solidAt(obj.x - 2, py)) sideA++;
      if (solidAt(obj.x + obj.width + 2, py)) sideB++;
    } else {
      const px = obj.x + obj.width * t;
      if (solidAt(px, obj.y - 2)) sideA++;
      if (solidAt(px, obj.y + obj.height + 2)) sideB++;
    }
  }

  if (sideA !== sideB) {
    // More room on side A → outside is side B.
    if (vertical) return sideA > sideB ? "right" : "left";
    return sideA > sideB ? "bottom" : "top";
  }
  return vertical ? "left" : "top";
}

/** Natural size of a collection-tileset image, looked up by sprite stem. */
function naturalSize(map, stem) {
  for (const ts of map.tilesets) {
    if (!Array.isArray(ts.tiles)) continue;
    for (const tile of ts.tiles) {
      if (!tile.image) continue;
      const name = tile.image
        .split("/")
        .pop()
        .replace(/\.[^.]+$/, "");
      if (name === stem) return { w: tile.imagewidth, h: tile.imageheight };
    }
  }
  return null;
}

/** @param {object} map Parsed Tiled JSON. */
export function drawOutlineStrips(map) {
  const layers = map.layers.filter(
    (l) => l.type === "objectgroup" && l.name.toLowerCase().startsWith("outline"),
  );
  if (!layers.length) return 0;

  const mask = paintedMask(map);

  let drawn = 0;
  for (const layer of layers) {
    if (layer.visible === false) continue;
    for (const obj of layer.objects ?? []) {
      if (obj.gid) {
        console.warn(
          `[outline] "${obj.name}" is a tile object; use a plain rectangle so it can be repeated`,
        );
        continue;
      }
      if (!obj.width || !obj.height) continue;

      const kind = kindOf(obj, map, mask);
      const stem = `outline${kind[0].toUpperCase()}${kind.slice(1)}`;
      const nat = naturalSize(map, stem);
      if (!nat) {
        console.warn(`[outline] no sprite for "${stem}" — run scripts/export-sprites.mjs`);
        continue;
      }

      // Repeat along the rectangle's length; thickness stays the sprite's own.
      const width = VERTICAL.has(kind) ? nat.w : obj.width;
      const height = VERTICAL.has(kind) ? obj.height : nat.h;

      const bias = obj.properties?.find((p) => p.name === "zBias")?.value ?? 0;

      k.add([
        k.sprite(collectionSpriteName(stem), { tiled: true, width, height }),
        k.pos(obj.x, obj.y),
        k.anchor("topleft"),
        k.z(Z.OUTLINE + bias),
        "outline",
      ]);
      drawn++;
    }
  }
  return drawn;
}
