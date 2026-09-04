import k from "./kaplayCtx.js";
import { asset } from "./paths.js";
import { tilesetSpriteName } from "./tilemap.js";

/** Sprite registration. Everything drawn from a real image is declared here. */

const CYBER = "assets/pixel_cyberpunk_interior_free_1.0.1/pixel-cyberpunk-interior.png";

/** Source size of the cyberpunk sheet, to normalise pixel rects to quads. */
const CYBER_SHEET = /** @type {[number, number]} */ ([672, 352]);

/** Walk.png is a column-major 4x4 grid (column = facing, row = frame). kaplay
 *  slices row-major, so each direction's frames are strided by 4. */
const DIRECTION_COLUMN = { down: 0, up: 1, left: 2, right: 3 };

const walkFrames = (column) => [column, column + 4, column + 8, column + 12];

/** Floor/wall tiles, cut from the sheet by pixel rect (they're painted into
 *  tile layers, not placed as objects). */
const SURFACES = {
  floorTile: { x: 0, y: 64, w: 16, h: 16 },
  wallTile: { x: 80, y: 16, w: 16, h: 16 },
};

/**
 * Registers one sprite cut from a sheet by pixel rect. loadSprite (not
 * loadSpriteAtlas) so the name registers synchronously — the atlas variant
 * registers after the load event, racing scenes built on onLoad.
 *
 * @param {string} name
 * @param {string} url
 * @param {[number, number]} sheet Source image size in pixels.
 * @param {{ x: number, y: number, w: number, h: number }} region
 */
function loadSpriteRegion(name, url, [sheetW, sheetH], region) {
  k.loadSprite(name, url, {
    frames: [k.quad(region.x / sheetW, region.y / sheetH, region.w / sheetW, region.h / sheetH)],
  });
}

/** Registers every tileset the map references, sliced into its tile grid.
 *  @param {object} map Parsed Tiled JSON. */
function loadMapTilesets(map) {
  for (const ts of map.tilesets) {
    if (ts.source) {
      console.warn(
        `[assets] tileset "${ts.name}" is external (.tsx); re-import with "Embed in map".`,
      );
      continue;
    }
    if (ts.spacing || ts.margin) {
      console.warn(`[assets] tileset "${ts.name}" uses spacing/margin, which kaplay can't slice.`);
    }
    // "Collection of Images" tileset: one image per tile, each registered as a
    // sprite named by its file stem — how Tiled-placed furniture finds its art.
    if (Array.isArray(ts.tiles) && ts.tiles.length && !ts.image) {
      for (const tile of ts.tiles) {
        if (!tile.image) continue;
        const name = tile.image
          .split("/")
          .pop()
          .replace(/\.[^.]+$/, "");
        k.loadSprite(collectionSpriteName(name), asset(`assets/${tile.image}`));
      }
      continue;
    }
    const columns = ts.columns || Math.floor(ts.imagewidth / ts.tilewidth);
    const rows = Math.ceil((ts.tilecount || columns) / columns);
    // ts.image is relative to map.json (public/assets/).
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
    anims[`idle-${dir}`] = { frames: [column], loop: false, speed: 1 }; // first frame of the cycle
  }

  // Player art is from the Ninja Adventure pack (CC0); the cyberpunk pack is furniture only.
  k.loadSprite("player", asset("assets/player/Walk.png"), { sliceX: 4, sliceY: 4, anims });

  const sheet = asset(CYBER);
  for (const [name, region] of Object.entries(SURFACES)) {
    loadSpriteRegion(name, sheet, CYBER_SHEET, region);
  }
}

/** Sprite name for one image of a collection tileset. */
export const collectionSpriteName = (stem) => `art:${stem}`;

/**
 * Resolves a Tiled tile-object gid to a registered sprite name (or null).
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
  return collectionSpriteName(
    tile.image
      .split("/")
      .pop()
      .replace(/\.[^.]+$/, ""),
  );
}
