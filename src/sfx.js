import k from "./kaplayCtx.js";

/** Sound effects. Footsteps loop while moving (fast when running); the click
 *  fires on examine. A master SFX volume (0..1) scales them all, persisted so it
 *  survives reloads. */

const FOOTSTEP_VOLUME = 0.5;
const CLICK_VOLUME = 0.6;
const STORAGE_KEY = "sfxVolume";

let footstepHandle = null;
/** @type {"footstep_slow" | "footstep_fast" | null} */
let footstepKind = null;

let sfxVolume = readStoredVolume();

function readStoredVolume() {
  try {
    const v = parseFloat(localStorage.getItem(STORAGE_KEY) ?? "");
    return Number.isFinite(v) ? clamp01(v) : 0.3;
  } catch {
    return 0.3;
  }
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function getSfxVolume() {
  return sfxVolume;
}

export function setSfxVolume(v) {
  sfxVolume = clamp01(v);
  try {
    localStorage.setItem(STORAGE_KEY, String(sfxVolume));
  } catch {
    /* storage unavailable — fine, just don't persist */
  }
  if (footstepHandle) footstepHandle.volume = FOOTSTEP_VOLUME * sfxVolume;
}

/** Keeps the right footstep loop playing while moving; stops it when idle. */
export function updateFootsteps(moving, running) {
  const want = !moving ? null : running ? "footstep_fast" : "footstep_slow";
  if (want === footstepKind) return;
  if (footstepHandle) {
    footstepHandle.stop();
    footstepHandle = null;
  }
  footstepKind = want;
  if (want) footstepHandle = k.play(want, { loop: true, volume: FOOTSTEP_VOLUME * sfxVolume });
}

export function playClick() {
  k.play("click", { volume: CLICK_VOLUME * sfxVolume });
}
