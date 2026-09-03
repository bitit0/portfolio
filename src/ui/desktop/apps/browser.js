/**
 * A minimal in-OS web browser.
 *
 * Not a real embedded browser: almost every site worth linking (GitHub,
 * LinkedIn, …) forbids being framed via X-Frame-Options / CSP, so an <iframe>
 * would just show a blank box. Instead this is an honest launcher — a start
 * page of bookmarks plus an address bar, both of which open the destination in
 * a real browser tab.
 */

import { BOOKMARKS } from "../../../content.js";

export function browser() {
  const el = document.createElement("div");
  el.className = "app-browser";

  el.innerHTML = `
    <form class="browser-bar">
      <span class="browser-lock" aria-hidden="true">🔒</span>
      <input
        class="browser-url"
        type="text"
        inputmode="url"
        placeholder="Search or type a URL"
        aria-label="Address bar"
      />
      <button class="browser-go" type="submit">Go</button>
    </form>
    <div class="browser-page">
      <h1 class="browser-title">Bookmarks</h1>
      <div class="browser-grid"></div>
    </div>
  `;

  const grid = /** @type {HTMLElement} */ (el.querySelector(".browser-grid"));
  for (const mark of BOOKMARKS) {
    const a = document.createElement("a");
    a.className = "browser-tile";
    a.href = mark.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = `<span class="browser-tile-glyph"></span><span class="browser-tile-label"></span>`;
    /** @type {HTMLElement} */ (a.querySelector(".browser-tile-glyph")).textContent = mark.glyph ?? "🔗";
    /** @type {HTMLElement} */ (a.querySelector(".browser-tile-label")).textContent = mark.label;
    grid.append(a);
  }

  const form = /** @type {HTMLFormElement} */ (el.querySelector(".browser-bar"));
  const input = /** @type {HTMLInputElement} */ (el.querySelector(".browser-url"));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = normalizeUrl(input.value.trim());
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });

  return el;
}

/**
 * Turns whatever the user typed into something openable: a bare domain gets an
 * https:// prefix, anything without a dot becomes a web search.
 */
function normalizeUrl(text) {
  if (!text) return "";
  if (/^https?:\/\//i.test(text) || /^mailto:/i.test(text)) return text;
  if (/^[^\s.]+\.[^\s]+$/.test(text)) return `https://${text}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(text)}`;
}
