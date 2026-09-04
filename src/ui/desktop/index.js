import { VFS } from "../../content.js";
import { asset } from "../../paths.js";
import { pushLayer, popLayer } from "../../uiState.js";
import { createWindowManager } from "./windowManager.js";
import { fileExplorer } from "./apps/fileExplorer.js";
import { textViewer } from "./apps/textViewer.js";
import { imageViewer } from "./apps/imageViewer.js";
import { pdfViewer } from "./apps/pdfViewer.js";
import { browser } from "./apps/browser.js";
import { mediaPlayer } from "./apps/mediaPlayer.js";
import { iconFor, childrenOf, idForPath } from "./vfs.js";

/** Desktop-shortcut order, curated rather than sorted. Unlisted names sort last. */
const DESKTOP_ORDER = ["readme.md", "projects", "resume.pdf", "photos", "Email", "GitHub"];

/**
 * The in-game computer: a fake desktop OS over the canvas, rebuilt on each use
 * so it always opens clean.
 */

const root = /** @type {HTMLElement} */ (document.getElementById("desktop"));

/** @type {ReturnType<typeof createWindowManager> | null} */
let wm = null;

/** Which app renders each node type — add a type by adding one entry + renderer. */
const APPS = {
  text: { render: textViewer, width: 520, height: 380 },
  image: { render: imageViewer, width: 420, height: 340 },
  pdf: { render: pdfViewer, width: 680, height: 560 },
};

/** Dock-pinned apps (programs, not files). `id` matches the window each opens,
 *  so the dock can show a running indicator. */
const LAUNCHERS = [
  { glyph: "🗂", label: "Files", id: idForPath([VFS.name]), open: () => openNode(VFS, [VFS.name]) },
  { glyph: "🌐", label: "Browser", id: "app:browser", open: openBrowser },
  { glyph: "🎵", label: "Media Player", id: "app:media", open: openMedia },
];

function openBrowser() {
  if (!wm) return;
  wm.openWindow({
    id: "app:browser",
    title: "Browser",
    icon: "🌐",
    content: browser(),
    width: 640,
    height: 460,
  });
}

function openMedia() {
  if (!wm) return;
  wm.openWindow({
    id: "app:media",
    title: "Media Player",
    icon: "🎵",
    content: mediaPlayer(),
    width: 420,
    height: 520,
  });
}

/** Handle of the clock/dock refresh interval, cleared when the OS closes. */
let clockTimer = null;

export function openDesktop() {
  if (wm) return;

  root.innerHTML = `
    <div class="os" role="dialog" aria-modal="true" aria-label="Computer">
      <header class="os-topbar">
        <span class="os-topbar-left">NATHAN.OS</span>
        <span class="os-clock" aria-live="off">—</span>
        <span class="os-topbar-right">
          <button class="os-exit" type="button" title="Leave computer" aria-label="Leave computer">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                d="M12 3.5v8.5 M7.4 6.6a7 7 0 1 0 9.2 0"
              />
            </svg>
          </button>
        </span>
      </header>
      <div class="os-body">
        <nav class="os-dock" aria-label="Applications"></nav>
        <div class="os-screen">
          <div class="os-icons"></div>
          <div class="os-windows"></div>
        </div>
      </div>
    </div>
  `;
  root.hidden = false;

  // Desktop wallpaper. Set via JS so the base URL resolves on a subpath deploy;
  // if the file is missing the browser falls back to .os-screen's colour.
  /** @type {HTMLElement} */ (root.querySelector(".os-screen")).style.backgroundImage =
    `url("${asset("assets/background.jpg")}")`;

  const windowLayer = /** @type {HTMLElement} */ (root.querySelector(".os-windows"));
  wm = createWindowManager(windowLayer);

  root.querySelector(".os-exit").addEventListener("click", closeDesktop);

  renderDesktopIcons(/** @type {HTMLElement} */ (root.querySelector(".os-icons")));
  renderDock(/** @type {HTMLElement} */ (root.querySelector(".os-dock")));
  startClock();

  // Focus the OS so the canvas stops receiving keystrokes.
  document.getElementById("game")?.blur();
  /** @type {HTMLElement} */ (root.querySelector(".os-exit")).focus();

  pushLayer({ name: "desktop", close: handleEscape });
}

export function closeDesktop() {
  if (!wm) return;
  stopClock();
  wm.closeAll();
  wm = null;
  root.hidden = true;
  root.innerHTML = "";
  popLayer();
  document.getElementById("game")?.focus();
}

/** Drives the top-bar clock; the same tick refreshes the dock indicators, so a
 *  window closed from its titlebar clears its dock dot without extra wiring. */
function startClock() {
  const paint = () => {
    const clock = root.querySelector(".os-clock");
    if (clock) {
      // Pinned to Eastern so visitors see my local time, not their own. The
      // IANA zone handles EST/EDT daylight saving automatically.
      const zone = { timeZone: "America/New_York" };
      const now = new Date();
      const day = now.toLocaleDateString([], { weekday: "short", ...zone });
      const time = now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short", // appends "EST"/"EDT" so it reads as my time
        ...zone,
      });
      clock.textContent = `${day}  ${time}`;
    }
    updateDockIndicators();
  };
  paint();
  clockTimer = window.setInterval(paint, 1000);
}

function stopClock() {
  if (clockTimer !== null) window.clearInterval(clockTimer);
  clockTimer = null;
}

/** Lights the dock indicator for every app that currently has a window open. */
function updateDockIndicators() {
  if (!wm) return;
  for (const btn of root.querySelectorAll(".os-dock-item[data-id]")) {
    btn.classList.toggle("is-running", wm.isOpen(/** @type {HTMLElement} */ (btn).dataset.id));
  }
}

/** Escape closes the top window first, and only leaves the computer once no
 *  windows are open. */
function handleEscape() {
  if (wm?.closeTopWindow()) return;
  closeDesktop();
}

/** Draws desktop shortcuts (one per top-level entry) behind the window layer.
 *  @param {HTMLElement} container */
function renderDesktopIcons(container) {
  const rank = (name) => {
    const i = DESKTOP_ORDER.indexOf(name);
    return i === -1 ? Infinity : i;
  };
  for (const node of [...childrenOf(VFS)].sort((a, b) => rank(a.name) - rank(b.name))) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "os-icon";
    btn.innerHTML = `<span class="os-icon-glyph"></span><span class="os-icon-label"></span>`;
    /** @type {HTMLElement} */ (btn.querySelector(".os-icon-glyph")).textContent = iconFor(node);
    /** @type {HTMLElement} */ (btn.querySelector(".os-icon-label")).textContent = node.name;
    btn.addEventListener("click", () => openNode(node, [VFS.name, node.name]));
    container.append(btn);
  }
}

/**
 * Fills the dock with the pinned apps (each carries the id of the window it
 * opens, for the running indicator).
 * @param {HTMLElement} dock
 */
function renderDock(dock) {
  for (const app of LAUNCHERS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "os-dock-item";
    btn.title = app.label;
    btn.setAttribute("aria-label", app.label);
    btn.textContent = app.glyph;
    btn.dataset.id = app.id;
    btn.addEventListener("click", () => {
      app.open();
      updateDockIndicators();
    });
    dock.append(btn);
  }
}

/**
 * @param {import("../../content.js").VfsNode} node
 * @param {string[]} path Names from the root down to this node.
 */
function openNode(node, path) {
  if (!wm) return;

  // Links leave the game entirely, so they get a real tab rather than a window.
  if (node.type === "link") {
    window.open(node.href, "_blank", "noopener,noreferrer");
    return;
  }

  const id = idForPath(path);

  if (node.type === "dir") {
    wm.openWindow({
      id,
      title: node.name,
      icon: iconFor(node),
      content: fileExplorer(node, path, openNode),
      width: 480,
      height: 340,
    });
    return;
  }

  const app = APPS[node.type];
  if (!app) {
    console.warn(`[desktop] no app registered for node type "${node.type}"`);
    return;
  }

  wm.openWindow({
    id,
    title: node.name,
    icon: iconFor(node),
    content: app.render(node),
    width: app.width,
    height: app.height,
  });
}
