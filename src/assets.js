import k from "./kaplayCtx.js";
import { asset } from "./paths.js";
import { tilesetSpriteName } from "./tilemap.js";

/**
 * Sprite registration. Everything drawn from a real image is declared here.
 */

const CYBER = "assets/pixel_cyberpunk_interior_free_1.0.1/pixel-cyberpunk-interior.png";

/** Source size of the cyberpunk sheet, needed to normalise pixel rects to quads. */
const CYBER_SHEET = /** @type {[number, number]} */ ([672, 352]);

/**
 * Walk.png is 64x64 = a 4x4 grid, and it is COLUMN-major: each column is a
 * facing direction, each row is a frame of that direction's walk cycle.
 * kaplay numbers sliced frames row-major, so a direction's frames are strided
 * by 4 rather than contiguous — hence `frames: [...]` instead of `from`/`to`.
 *
 * Verified by measuring skin-tone pixels per column: col 0 has the most (face
 * on), col 1 the fewest (back of head), and cols 2/3 are mirror images with
 * centroids 1.03px either side of centre.
 */
const DIRECTION_COLUMN = { down: 0, up: 1, left: 2, right: 3 };

const walkFrames = (column) => [column, column + 4, column + 8, column + 12];

/**
 * Floor and wall tiles, still cut from the main sheet by pixel rect because
 * they are painted into tile layers rather than placed as objects.
 */
const SURFACES = {
  floorTile: { x: 0, y: 64, w: 16, h: 16 },
  wallTile: { x: 80, y: 16, w: 16, h: 16 },
};

/**
 * Registers one sprite cut out of a larger sheet by pixel rect.
 *
 * Deliberately NOT loadSpriteAtlas: that only registers its named cuts inside a
 * callback that runs after the global load event, so a scene built on onLoad
 * still finds the name unregistered and throws. loadSprite registers the name
 * synchronously, which removes the race entirely.
 *
 * @param {string} name
 * @param {string} url
 * @param {[number, number]} sheet Source image size in pixels.
 * @param {{ x: number, y: number, w: number, h: number }} region
 */
function loadSpriteRegion(name, url, [sheetW, sheetH], region) {
  k.loadSprite(name, url, {
    frames: [
      k.quad(region.x / sheetW, region.y / sheetH, region.w / sheetW, region.h / sheetH),
    ],
  });
}

/**
 * Registers every tileset the map references, sliced into its tile grid, so the
 * tile-layer renderer can address tiles by frame index.
 *
 * @param {object} map Parsed Tiled JSON.
 */
function loadMapTilesets(map) {
  for (const ts of map.tilesets) {
    if (ts.source) {
      console.warn(
        `[assets] tileset "${ts.name}" is external (.tsx). Re-import it in ` +
          `Tiled with "Embed in map" ticked.`,
      );
      continue;
    }
    if (ts.spacing || ts.margin) {
      console.warn(
        `[assets] tileset "${ts.name}" uses spacing/margin, which kaplay's ` +
          `slicing cannot express — tiles will be misaligned.`,
      );
    }
    // A "Collection of Images" tileset has one image per tile instead of one
    // sheet. Each becomes its own sprite, named by the tile's file stem, which
    // is how furniture placed in Tiled resolves to art here.
    if (Array.isArray(ts.tiles) && ts.tiles.length && !ts.image) {
      for (const tile of ts.tiles) {
        if (!tile.image) continue;
        const name = tile.image.split("/").pop().replace(/\.[^.]+$/, "");
        k.loadSprite(collectionSpriteName(name), asset(`assets/${tile.image}`));
      }
      continue;
    }
    const columns = ts.columns || Math.floor(ts.imagewidth / ts.tilewidth);
    const rows = Math.ceil((ts.tilecount || columns) / columns);
    // ts.image is relative to map.json, which lives in public/assets/.
    k.loadSprite(tilesetSpriteName(ts), asset(`assets/${ts.image}`), {
      sliceX: columns,
      sliceY: rows,
    });
  }
}

/** @param {object} map Parsed Tiled JSON. */
export function loadGameAssets(map) {
  loadMapTilesets(map);

  /** @type {Record<string, object>} */
  const anims = {};
  for (const [dir, column] of Object.entries(DIRECTION_COLUMN)) {
    anims[`walk-${dir}`] = { frames: walkFrames(column), loop: true, speed: 8 };
    // Idle is the first frame of that direction's cycle.
    anims[`idle-${dir}`] = { frames: [column], loop: false, speed: 1 };
  }

  // The cyberpunk pack is furniture only — no character art — so the player
  // sprite comes from the Ninja Adventure pack (CC0), copied into assets/player/.
  k.loadSprite("player", asset("assets/player/Walk.png"), {
    sliceX: 4,
    sliceY: 4,
    anims,
  });

  const sheet = asset(CYBER);
  for (const [name, region] of Object.entries(SURFACES)) {
    loadSpriteRegion(name, sheet, CYBER_SHEET, region);
  }
}

/**
 * Map object name -> registered sprite name.
 *
 * Anything not listed falls back to its placeholder rect, so the room stays
 * playable while art is still being sourced. "plant" is deliberately absent:
 * a cyberpunk interior pack has no houseplant.
 */
/** Sprite name for one image of a collection tileset. */
export const collectionSpriteName = (stem) => `art:${stem}`;

/**
 * Resolves a Tiled tile-object gid to a registered sprite name.
 *
 * Furniture is placed in Tiled now, so which art an object uses is map data,
 * not something declared here.
 *
 * @param {object} map
 * @param {number} gid
 * @returns {string | null}
 */
export function spriteForGid(map, gid) {
  const id = gid & 0x1fffffff;
  if (!id) return null;
  let best = null;
  for (const ts of map.tilesets) {
    if (ts.firstgid <= id && (!best || ts.firstgid > best.firstgid)) best = ts;
  }
  if (!best || !Array.isArray(best.tiles)) return null;
  const tile = best.tiles.find((t) => t.id === id - best.firstgid);
  if (!tile?.image) return null;
  return collectionSpriteName(tile.image.split("/").pop().replace(/\.[^.]+$/, ""));
}
