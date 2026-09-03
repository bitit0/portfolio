/**
 * A small audio player over the PLAYLIST declared in src/content.js.
 *
 * One shared <audio> element drives everything; the UI just reflects its state.
 * Adding songs is data-only: drop files in public/assets/music/ and list them
 * in PLAYLIST — nothing here needs to change.
 */

import { PLAYLIST } from "../../../content.js";

export function mediaPlayer() {
  const el = document.createElement("div");
  el.className = "app-media";

  if (!PLAYLIST.length) {
    el.innerHTML = `
      <p class="app-empty">
        No songs yet. Drop audio files in <code>public/assets/music/</code> and
        list them in <code>PLAYLIST</code> (src/content.js).
      </p>
    `;
    return el;
  }

  el.innerHTML = `
    <div class="media-now">
      <div class="media-art" aria-hidden="true">🎵</div>
      <div class="media-meta">
        <div class="media-track">—</div>
        <div class="media-artist"></div>
      </div>
    </div>
    <input class="media-seek" type="range" min="0" max="0" value="0" step="1" aria-label="Seek" />
    <div class="media-times"><span class="media-cur">0:00</span><span class="media-dur">0:00</span></div>
    <div class="media-controls">
      <button class="media-btn media-prev" type="button" aria-label="Previous">⏮</button>
      <button class="media-btn media-play" type="button" aria-label="Play">▶</button>
      <button class="media-btn media-next" type="button" aria-label="Next">⏭</button>
    </div>
    <ol class="media-list"></ol>
  `;

  const audio = new Audio();
  audio.preload = "metadata";

  const q = (sel) => /** @type {HTMLElement} */ (el.querySelector(sel));
  const trackEl = q(".media-track");
  const artistEl = q(".media-artist");
  const playBtn = /** @type {HTMLButtonElement} */ (q(".media-play"));
  const seek = /** @type {HTMLInputElement} */ (q(".media-seek"));
  const curEl = q(".media-cur");
  const durEl = q(".media-dur");
  const list = q(".media-list");

  let index = 0;
  let seeking = false;

  PLAYLIST.forEach((track, i) => {
    const li = document.createElement("li");
    li.className = "media-item";
    li.innerHTML = `<span class="media-item-title"></span><span class="media-item-artist"></span>`;
    q0(li, ".media-item-title").textContent = track.title;
    q0(li, ".media-item-artist").textContent = track.artist ?? "";
    li.addEventListener("click", () => load(i, true));
    list.append(li);
  });

  function q0(parent, sel) {
    return /** @type {HTMLElement} */ (parent.querySelector(sel));
  }

  function load(i, autoplay) {
    index = (i + PLAYLIST.length) % PLAYLIST.length;
    const track = PLAYLIST[index];
    audio.src = track.src;
    trackEl.textContent = track.title;
    artistEl.textContent = track.artist ?? "";
    for (const [n, li] of [...list.children].entries()) {
      li.classList.toggle("is-current", n === index);
    }
    if (autoplay) audio.play().catch(() => {});
  }

  playBtn.addEventListener("click", () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });
  q(".media-prev").addEventListener("click", () => load(index - 1, true));
  q(".media-next").addEventListener("click", () => load(index + 1, true));

  audio.addEventListener("play", () => (playBtn.textContent = "⏸"));
  audio.addEventListener("pause", () => (playBtn.textContent = "▶"));
  audio.addEventListener("ended", () => load(index + 1, true));

  audio.addEventListener("loadedmetadata", () => {
    seek.max = String(Math.floor(audio.duration || 0));
    durEl.textContent = fmt(audio.duration);
  });
  audio.addEventListener("timeupdate", () => {
    if (seeking) return;
    seek.value = String(Math.floor(audio.currentTime));
    curEl.textContent = fmt(audio.currentTime);
  });

  seek.addEventListener("input", () => {
    seeking = true;
    curEl.textContent = fmt(Number(seek.value));
  });
  seek.addEventListener("change", () => {
    audio.currentTime = Number(seek.value);
    seeking = false;
  });

  // Stop playback when the window closes (its DOM is removed from the document).
  const observer = new MutationObserver(() => {
    if (!el.isConnected) {
      audio.pause();
      audio.src = "";
      observer.disconnect();
    }
  });
  // Observe once attached; the window manager appends el into the window body.
  queueMicrotask(() => {
    if (el.parentNode) observer.observe(el.parentNode, { childList: true });
  });

  load(0, false);
  return el;
}

function fmt(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
