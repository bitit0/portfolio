import { getSfxVolume, setSfxVolume } from "../sfx.js";

/** Bottom-left SFX volume control: a mute toggle + slider, wired to the master
 *  SFX volume in sfx.js (which persists it). */
export function mountVolumeBar() {
  const el = document.createElement("div");
  el.id = "volumebar";
  el.innerHTML = `
    <button class="vol-mute" type="button" aria-label="Mute sound effects"></button>
    <input class="vol-slider" type="range" min="0" max="1" step="0.01" aria-label="Sound effects volume" />
    <span class="vol-label">SFX</span>
  `;
  document.body.append(el);

  const btn = /** @type {HTMLButtonElement} */ (el.querySelector(".vol-mute"));
  const slider = /** @type {HTMLInputElement} */ (el.querySelector(".vol-slider"));

  let lastNonZero = getSfxVolume() || 0.3;

  const glyph = (v) => (v === 0 ? "🔇" : v < 0.5 ? "🔉" : "🔊");
  const sync = () => {
    const v = getSfxVolume();
    slider.value = String(v);
    btn.textContent = glyph(v);
  };

  slider.addEventListener("input", () => {
    const v = Number(slider.value);
    if (v > 0) lastNonZero = v;
    setSfxVolume(v);
    btn.textContent = glyph(v);
  });

  btn.addEventListener("click", () => {
    setSfxVolume(getSfxVolume() === 0 ? lastNonZero || 0.3 : 0);
    sync();
  });

  sync();
}
