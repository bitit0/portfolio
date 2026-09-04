import k from "../kaplayCtx.js";
import { UI_HINT_SIZE, INTERACT_KEY_LABEL, Z } from "../constants.js";
import { setupCamera } from "../camera.js";
import { renderTileLayers } from "../tilemap.js";
import { drawOutlineStrips } from "../outlineStrips.js";
import { makePlayer } from "../entities/player.js";
import { makeInteractable, setupInteractionSystem } from "../entities/interactable.js";

/** @param {import("../entities/interactable.js").MapObject[]} objects */
function layerObjects(map, layerName) {
  const layer = map.layers.find((l) => l.name === layerName);
  if (!layer) throw new Error(`map.json is missing the "${layerName}" layer`);
  return layer.objects;
}

/**
 * The room scene. All positions come from map.json; this only turns each layer
 * into game objects, never decides where things go.
 */
export function registerRoomScene() {
  k.scene("room", (map) => {
    // Size is whatever the map says — no assumption of a rectangle or fixed width.
    const roomWidth = map.width * map.tilewidth;
    const roomHeight = map.height * map.tileheight;
    setupCamera(roomWidth, roomHeight);

    // --- Everything painted in Tiled ---
    const tilesDrawn = renderTileLayers(map);
    drawOutlineStrips(map);
    if (tilesDrawn === 0) {
      console.warn(
        "[room] no tiles painted yet — floor and walls come from the map's " +
          "tile layers, so the room will look empty until they are drawn in Tiled.",
      );
    }

    // --- Walls: pure collision (the visible walls are painted tiles) ---
    for (const wall of layerObjects(map, "boundaries")) {
      k.add([
        k.pos(wall.x, wall.y),
        k.anchor("topleft"),
        k.area({ shape: new k.Rect(k.vec2(0), wall.width, wall.height) }),
        k.body({ isStatic: true }),
        k.opacity(0), // invisible except with F1 debug on
        k.rect(wall.width, wall.height),
        "boundary",
      ]);
    }

    // --- Furniture ---
    for (const obj of layerObjects(map, "objects")) {
      makeInteractable(obj, map);
    }

    // --- Player ---
    const spawn = layerObjects(map, "spawnpoints").find((o) => o.name === "player");
    if (!spawn) throw new Error('map.json has no spawnpoint named "player"');
    const player = makePlayer(spawn);

    setupInteractionSystem(player);

    // --- Controls hint (fixed() → screen pixels, sharp at any zoom) ---
    const hint = k.add([
      k.text(`WASD / arrows to move   ·   Shift to run   ·   ${INTERACT_KEY_LABEL} to examine`, {
        size: UI_HINT_SIZE,
      }),
      k.color(196, 192, 214),
      k.pos(0, 0),
      k.anchor("center"),
      k.fixed(),
      k.z(Z.HINT),
    ]);

    const placeHint = () => {
      hint.pos = k.vec2(k.width() / 2, k.height() - UI_HINT_SIZE * 1.6);
    };
    placeHint();
    k.onResize(placeHint);
  });
}
