import k from "./kaplayCtx.js";

/** Sound effects. Footsteps loop while moving (fast when running); the click
 *  fires on examine. */

const FOOTSTEP_VOLUME = 0.5;

let footstepHandle = null;
/** @type {"footstep_slow" | "footstep_fast" | null} */
let footstepKind = null;

/** Keeps the right footstep loop playing while moving; stops it when idle. */
export function updateFootsteps(moving, running) {
  const want = !moving ? null : running ? "footstep_fast" : "footstep_slow";
  if (want === footstepKind) return;
  if (footstepHandle) {
    footstepHandle.stop();
    footstepHandle = null;
  }
  footstepKind = want;
  if (want) footstepHandle = k.play(want, { loop: true, volume: FOOTSTEP_VOLUME });
}

export function playClick() {
  k.play("click", { volume: 0.6 });
}
