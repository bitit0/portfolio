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
 * The starter room.
 *
 * Everything positional comes out of public/assets/map.json — this function
 * only decides how each layer is turned into game objects, never where things
 * are. That is what keeps "add a new examinable object" a data-only change.
 */
export function registerRoomScene() {
  k.scene("room", (map) => {
    // The room's size is whatever the map says, so reshaping it in Tiled just
    // works — nothing here assumes a rectangle or a fixed width.
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

    // --- Walls: solid, and drawn with their own depth so the player passes
    //     behind the back wall and in front of nothing. ---
    for (const wall of layerObjects(map, "boundaries")) {
      k.add([
        k.pos(wall.x, wall.y),
        k.anchor("topleft"),
        k.area({ shape: new k.Rect(k.vec2(0), wall.width, wall.height) }),
        k.body({ isStatic: true }),
        // Drawn only with F1 debug on: walls are painted in the map's tile
        // layers now, so these rects are pure collision.
        k.opacity(0),
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

    // --- Controls hint ---
    // fixed() so it ignores the camera zoom: its size is in screen pixels and
    // it stays sharp no matter how far the room is scaled up.
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
