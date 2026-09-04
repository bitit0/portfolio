import k from "../kaplayCtx.js";
import {
  PLAYER_SPEED,
  RUN_MULTIPLIER,
  RUN_KEYS,
  MOVE_KEYS,
  PLAYER_COLLIDER_SCALE,
} from "../constants.js";
import { isUIOpen } from "../uiState.js";
import { getMove } from "../touchInput.js";
import { updateFootsteps } from "../sfx.js";

/** Half the sprite's height, used for depth sorting against furniture. */
const HALF_HEIGHT = 8;

/**
 * Creates the player. Animations are named `walk-<dir>` / `idle-<dir>`.
 * @param {{ x: number, y: number }} spawn Centre point, world units.
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

  // play() restarts at frame 0, so only switch when the anim actually changes.
  let currentAnim = "idle-down";
  const setAnim = (name) => {
    if (name === currentAnim) return;
    player.play(name);
    currentAnim = name;
  };

  player.onUpdate(() => {
    // Sort by bottom edge, so the player is in front of lower things, behind higher.
    player.z = player.pos.y + HALF_HEIGHT;

    // The single guard that freezes the player while an overlay is open.
    if (isUIOpen()) {
      setAnim(`idle-${player.facing}`);
      updateFootsteps(false, false);
      return;
    }

    let dx = 0;
    let dy = 0;
    let facingFromKeys = null;
    for (const entry of MOVE_KEYS) {
      if (entry.keys.some((key) => k.isKeyDown(key))) {
        dx += entry.vec[0];
        dy += entry.vec[1];
        facingFromKeys = entry.dir;
      }
    }

    // The on-screen joystick contributes an analog vector on the same axes.
    const stick = getMove();
    dx += stick.x;
    dy += stick.y;

    if (dx === 0 && dy === 0) {
      setAnim(`idle-${player.facing}`);
      updateFootsteps(false, false);
      return;
    }

    // Keys pick a cardinal facing directly; the joystick's is derived from its
    // dominant axis so the sprite faces roughly where it is heading.
    player.facing =
      facingFromKeys ??
      (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down");

    setAnim(`walk-${player.facing}`);

    // Holding a run key — or pushing the joystick to its edge — speeds movement
    // up without changing the animation rate, so the walk cycle still reads.
    const running = RUN_KEYS.some((key) => k.isKeyDown(key)) || Math.hypot(stick.x, stick.y) > 0.85;
    const speed = running ? PLAYER_SPEED * RUN_MULTIPLIER : PLAYER_SPEED;
    updateFootsteps(true, running);

    // Normalise so diagonals are not faster than the cardinals.
    player.move(k.vec2(dx, dy).unit().scale(speed));
  });

  return player;
}
