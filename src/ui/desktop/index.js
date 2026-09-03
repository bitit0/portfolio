import { VFS } from "../../content.js";
import { pushLayer, popLayer } from "../../uiState.js";
import { createWindowManager } from "./windowManager.js";
import { fileExplorer } from "./apps/fileExplorer.js";
import { textViewer } from "./apps/textViewer.js";
import { imageViewer } from "./apps/imageViewer.js";
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
};

export function openDesktop() {
  if (wm) return;

  root.innerHTML = `
    <div class="os" role="dialog" aria-modal="true" aria-label="Computer">
      <header class="os-bar">
        <span class="os-title">NATE.OS</span>
        <button class="os-exit" type="button">Leave computer</button>
      </header>
      <div class="os-screen">
        <div class="os-icons"></div>
        <div class="os-windows"></div>
      </div>
      <footer class="os-hint">Esc closes the top window, then leaves the computer</footer>
    </div>
  `;
  root.hidden = false;

  const windowLayer = /** @type {HTMLElement} */ (root.querySelector(".os-windows"));
  wm = createWindowManager(windowLayer);

  root.querySelector(".os-exit").addEventListener("click", closeDesktop);

  renderDesktopIcons(/** @type {HTMLElement} */ (root.querySelector(".os-icons")));

  // Hand keyboard focus to the OS so the canvas stops receiving keystrokes.
  document.getElementById("game")?.blur();
  /** @type {HTMLElement} */ (root.querySelector(".os-exit")).focus();

  pushLayer({ name: "desktop", close: handleEscape });
}

export function closeDesktop() {
  if (!wm) return;
  wm.closeAll();
  wm = null;
  root.hidden = true;
  root.innerHTML = "";
  popLayer();
  document.getElementById("game")?.focus();
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

/** @param {HTMLElement} container */
function renderDesktopIcons(container) {
  for (const node of sortNodes(childrenOf(VFS))) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "os-icon";
    btn.innerHTML = `<span class="os-icon-glyph"></span><span class="os-icon-label"></span>`;
    btn.querySelector(".os-icon-glyph").textContent = iconFor(node);
    btn.querySelector(".os-icon-label").textContent = node.name;
    btn.addEventListener("click", () => openNode(node, [VFS.name, node.name]));
    container.append(btn);
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
