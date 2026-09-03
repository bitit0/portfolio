import { VFS } from "../../content.js";
import { pushLayer, popLayer } from "../../uiState.js";
import { createWindowManager } from "./windowManager.js";
import { fileExplorer } from "./apps/fileExplorer.js";
import { textViewer } from "./apps/textViewer.js";
import { imageViewer } from "./apps/imageViewer.js";
import { pdfViewer } from "./apps/pdfViewer.js";
import { browser } from "./apps/browser.js";
import { mediaPlayer } from "./apps/mediaPlayer.js";
import { iconFor, childrenOf, sortNodes, idForPath } from "./vfs.js";

/**
 * The in-game computer: a fake desktop OS mounted over the canvas.
 *
 * Mounted and torn down on each use rather than kept hidden, so walking away
 * from the computer and coming back gives a clean desktop.
 */

const root = /** @type {HTMLElement} */ (document.getElementById("desktop"));

/** @type {ReturnType<typeof createWindowManager> | null} */
let wm = null;

/**
 * Which app renders a node. Adding a file type means adding one entry here and
 * one renderer — nothing else in the OS needs to know about it.
 */
const APPS = {
  text: { render: textViewer, width: 520, height: 380 },
  image: { render: imageViewer, width: 420, height: 340 },
  pdf: { render: pdfViewer, width: 680, height: 560 },
};

/**
 * Apps pinned to the dock. These are programs, not files — Files opens the
 * explorer at the filesystem root, the others are standalone windows. `id`
 * matches the window each one opens, so the dock can show a running indicator.
 */
const LAUNCHERS = [
  { glyph: "🗂", label: "Files", id: idForPath([VFS.name]), open: () => openNode(VFS, [VFS.name]) },
  { glyph: "🌐", label: "Browser", id: "app:browser", open: openBrowser },
  { glyph: "🎵", label: "Media Player", id: "app:media", open: openMedia },
];

function openBrowser() {
  if (!wm) return;
  wm.openWindow({ id: "app:browser", title: "Browser", icon: "🌐", content: browser(), width: 640, height: 460 });
}

function openMedia() {
  if (!wm) return;
  wm.openWindow({ id: "app:media", title: "Media Player", icon: "🎵", content: mediaPlayer(), width: 420, height: 520 });
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

  const windowLayer = /** @type {HTMLElement} */ (root.querySelector(".os-windows"));
  wm = createWindowManager(windowLayer);

  root.querySelector(".os-exit").addEventListener("click", closeDesktop);

  renderDesktopIcons(/** @type {HTMLElement} */ (root.querySelector(".os-icons")));
  renderDock(/** @type {HTMLElement} */ (root.querySelector(".os-dock")));
  startClock();

  // Hand keyboard focus to the OS so the canvas stops receiving keystrokes.
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

/**
 * Drives the top-bar clock and, in the same tick, refreshes the dock's
 * running-app indicators — so closing a window from its titlebar clears the
 * dock dot within a second without wiring the two together.
 */
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

/**
 * Escape peels one layer at a time: the topmost window first, and only once
 * nothing is open does it leave the computer. Closing the whole OS on the first
 * press would be infuriating three folders deep.
 */
function handleEscape() {
  if (wm?.closeTopWindow()) return;
  closeDesktop();
}

/**
 * Draws the desktop shortcuts — one per top-level filesystem entry — behind the
 * window layer, the way a real desktop shows files and folders.
 *
 * @param {HTMLElement} container
 */
function renderDesktopIcons(container) {
  for (const node of sortNodes(childrenOf(VFS))) {
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
 * Fills the dock with the pinned apps. Each launcher carries the id of the
 * window it opens, so the dock can light a running indicator beside it.
 *
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
