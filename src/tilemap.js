import k from "./kaplayCtx.js";
import { Z } from "./constants.js";

/**
 * Renders Tiled tile layers. Each cell is a global tile id (GID); resolve it via
 * the tileset with the greatest firstgid <= GID, frame = gid - firstgid, 0 = empty.
 */

/** Tiled packs flip flags into the top 3 bits of the GID; the low 29 bits are
 *  the plain tile id. The flip bits are read separately where sprites are drawn. */
const GID_MASK = 0x1fffffff;

/** Sprite name registered for a tileset, so assets.js and this agree. */
export const tilesetSpriteName = (tileset) => `tileset:${tileset.name}`;

/**
 * @param {object} map Parsed Tiled JSON.
 * @param {number} gid
 * @returns {{ sprite: string, frame: number } | null}
 */
function resolveGid(map, gid) {
  const id = gid & GID_MASK;
  if (id === 0) return null;

  let best = null;
  for (const ts of map.tilesets) {
    if (ts.firstgid <= id && (!best || ts.firstgid > best.firstgid)) best = ts;
  }
  if (!best) {
    console.warn(`[tilemap] gid ${id} matches no tileset`);
    return null;
  }
  return { sprite: tilesetSpriteName(best), frame: id - best.firstgid };
}

/**
 * Draws every tile layer in file order (Tiled's stacking order). The exception
 * is a layer named "above", which renders over the player so wall tops and decor
 * can occlude them.
 *
 * @param {object} map
 * @param {{ aboveLayerName?: string }} [opts]
 */
export function renderTileLayers(map, { aboveLayerName = "above" } = {}) {
  const tw = map.tilewidth;
  const th = map.tileheight;
  let drawn = 0;

  map.layers.forEach((layer, index) => {
    if (layer.type !== "tilelayer" || layer.visible === false) return;
    if (!Array.isArray(layer.data)) {
      console.warn(
        `[tilemap] layer "${layer.name}" is not a plain array — set ` +
          `Map > Map Properties > Tile Layer Format to CSV in Tiled.`,
      );
      return;
    }

    // Everything except "above" sits below the player, in layer order.
    const z = layer.name === aboveLayerName ? Z.ABOVE : Z.TILES + index;

    for (let i = 0; i < layer.data.length; i++) {
      const resolved = resolveGid(map, layer.data[i]);
      if (!resolved) continue;

      const col = i % layer.width;
      const row = Math.floor(i / layer.width);

      const raw = layer.data[i];
      k.add([
        // Tiled packs horizontal/vertical flip into the gid's top bits.
        k.sprite(resolved.sprite, {
          frame: resolved.frame,
          flipX: Boolean(raw & 0x80000000),
          flipY: Boolean(raw & 0x40000000),
        }),
        k.pos(col * tw, row * th),
        k.anchor("topleft"),
        k.z(z),
        "tile",
      ]);
      drawn++;
    }
  });

  return drawn;
}
