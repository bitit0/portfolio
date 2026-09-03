import k from "../kaplayCtx.js";
import {
  PLAYER_SPEED,
  RUN_MULTIPLIER,
  RUN_KEYS,
  MOVE_KEYS,
  PLAYER_COLLIDER_SCALE,
} from "../constants.js";
import { isUIOpen } from "../uiState.js";


/** Half the sprite's height, used for depth sorting against furniture. */
const HALF_HEIGHT = 8;

/**
 * Creates the player, using the Ninja Adventure walk spritesheet registered in
 * src/assets.js. Animation names follow `walk-<dir>` / `idle-<dir>`.
 *
 * @param {{ x: number, y: number }} spawn Centre point, in world units.
 */
export function makePlayer(spawn) {
  const player = k.add([
    k.sprite("player", { anim: "idle-down" }),
    k.pos(spawn.x, spawn.y),
    k.anchor("center"),
    // Deliberately smaller than the 16x16 frame: the art has transparent
    // padding, and a tight collider stops the player snagging on doorways.
    k.area({ scale: PLAYER_COLLIDER_SCALE }),
    k.body(),
    k.z(0),
    "player",
    { facing: "down" },
  ]);

  // play() restarts the animation from frame 0, so calling it every frame would
  // freeze the walk cycle on its first frame. Only switch when it changes.
  let currentAnim = "idle-down";
  const setAnim = (name) => {
    if (name === currentAnim) return;
    player.play(name);
    currentAnim = name;
  };

  player.onUpdate(() => {
    // Depth sorting: everything in the room sorts by the y of its bottom edge,
    // so the player walks in front of the bed but behind the back wall.
    player.z = player.pos.y + HALF_HEIGHT;

    // The single guard that freezes the player while an overlay is open.
    if (isUIOpen()) {
      setAnim(`idle-${player.facing}`);
      return;
    }

    let dx = 0;
    let dy = 0;
    for (const entry of MOVE_KEYS) {
      if (entry.keys.some((key) => k.isKeyDown(key))) {
        dx += entry.vec[0];
        dy += entry.vec[1];
        player.facing = entry.dir;
      }
    }

    if (dx === 0 && dy === 0) {
      setAnim(`idle-${player.facing}`);
      return;
    }

    setAnim(`walk-${player.facing}`);

    // Holding a run key speeds movement up without changing the animation rate,
    // so the walk cycle still reads clearly at either speed.
    const running = RUN_KEYS.some((key) => k.isKeyDown(key));
    const speed = running ? PLAYER_SPEED * RUN_MULTIPLIER : PLAYER_SPEED;

    // Normalise so diagonals are not faster than the cardinals.
    player.move(k.vec2(dx, dy).unit().scale(speed));
  });

  return player;
}
