import { pushLayer, popLayer } from "../uiState.js";
import { DIALOGUE_CHARS_PER_SECOND, INTERACT_KEYS_DOM } from "../constants.js";

/**
 * The examine-an-object text box. DOM, not canvas: wrapping, scaling and real
 * <a> links all come for free.
 */

const root = /** @type {HTMLElement} */ (document.getElementById("dialogue"));

let state = null;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * @param {import("../content.js").DialogueEntry} entry
 */
export function openDialogue(entry) {
  if (state) return;
  if (!entry.lines?.length) return;

  root.innerHTML = `
    <div class="dialogue-box" role="dialog" aria-modal="true" aria-label="${escapeHtml(entry.label)}">
      <p class="dialogue-label"></p>
      <p class="dialogue-text"></p>
      <div class="dialogue-links" hidden></div>
      <p class="dialogue-hint">space</p>
    </div>
  `;
  root.hidden = false;

  const box = /** @type {HTMLElement} */ (root.querySelector(".dialogue-box"));
  state = {
    entry,
    page: 0,
    typed: 0,
    timer: null,
    box,
    labelEl: /** @type {HTMLElement} */ (root.querySelector(".dialogue-label")),
    textEl: /** @type {HTMLElement} */ (root.querySelector(".dialogue-text")),
    linksEl: /** @type {HTMLElement} */ (root.querySelector(".dialogue-links")),
    hintEl: /** @type {HTMLElement} */ (root.querySelector(".dialogue-hint")),
  };

  state.labelEl.textContent = entry.label;
  box.addEventListener("click", advance);
  window.addEventListener("keydown", onKeyDown);

  // Blur the canvas so kaplay stops seeing keys (belt and braces over isUIOpen()).
  document.getElementById("game")?.blur();
  box.focus?.();

  renderPage();
  pushLayer({ name: "dialogue", close: closeDialogue });
}

export function closeDialogue() {
  if (!state) return;
  stopTyping();
  state.box.removeEventListener("click", advance);
  window.removeEventListener("keydown", onKeyDown);
  root.hidden = true;
  root.innerHTML = "";
  state = null;
  popLayer();
  document.getElementById("game")?.focus();
}

function onKeyDown(e) {
  if (!state) return;
  // Escape is owned by uiState's global handler.
  if (e.key === "Escape") return;
  if (!INTERACT_KEYS_DOM.includes(e.key)) return;
  e.preventDefault();
  e.stopPropagation();
  advance();
}

function renderPage() {
  const { entry, page } = state;
  const line = entry.lines[page];
  const isLast = page === entry.lines.length - 1;

  state.textEl.textContent = "";
  state.typed = 0;
  state.hintEl.dataset.last = String(isLast);
  state.hintEl.textContent = isLast ? "space to close" : "space";

  // Links belong to the object, not a page, so they land on the last one.
  state.linksEl.hidden = true;
  state.linksEl.innerHTML = "";
  if (isLast && entry.links?.length) {
    state.linksEl.hidden = false;
    for (const link of entry.links) {
      const a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.label;
      if (!link.href.startsWith("mailto:")) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      // Otherwise the click bubbles to the box and advances past the links.
      a.addEventListener("click", (e) => e.stopPropagation());
      state.linksEl.append(a);
    }
  }

  if (prefersReducedMotion.matches) {
    state.textEl.textContent = line;
    state.typed = line.length;
    return;
  }
  startTyping(line);
}

function startTyping(line) {
  stopTyping();
  state.timer = window.setInterval(() => {
    if (!state) return;
    state.typed += 1;
    state.textEl.textContent = line.slice(0, state.typed);
    if (state.typed >= line.length) stopTyping();
  }, 1000 / DIALOGUE_CHARS_PER_SECOND);
}

function stopTyping() {
  if (state?.timer) {
    window.clearInterval(state.timer);
    state.timer = null;
  }
}

/** Skip the typewriter if it is still running, otherwise go to the next page. */
function advance() {
  if (!state) return;
  const line = state.entry.lines[state.page];

  if (state.typed < line.length) {
    stopTyping();
    state.textEl.textContent = line;
    state.typed = line.length;
    return;
  }

  if (state.page >= state.entry.lines.length - 1) {
    closeDialogue();
    return;
  }
  state.page += 1;
  renderPage();
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}
