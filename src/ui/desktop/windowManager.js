/**
 * A very small window manager for the in-game computer.
 *
 * Deliberately DOM: draggable titlebars, z-order on focus, scrollable bodies
 * and close buttons are all things the platform already does well.
 */

const CASCADE_STEP = 22;
const MAX_CASCADE = 6;

/** @param {HTMLElement} layer Element the windows are appended to. */
export function createWindowManager(layer) {
  /** @type {Map<string, HTMLElement>} */
  const windows = new Map();
  /** Order of creation, used to decide what Escape closes. */
  const order = [];
  /** Ids of minimized windows — hidden, but restorable from the tray. */
  const minimized = new Set();
  /** Saved geometry for maximized windows, keyed by element. */
  const restoreRects = new WeakMap();
  let zTop = 100;
  let cascade = 0;

  // Strip along the bottom of the screen holding one button per minimized
  // window. Hidden until something is minimized, so the desktop stays clean.
  const tray = document.createElement("div");
  tray.className = "win-tray";
  tray.hidden = true;
  layer.append(tray);

  function focus(id) {
    const el = windows.get(id);
    if (!el) return;
    zTop += 1;
    el.style.zIndex = String(zTop);
    for (const other of windows.values()) other.classList.toggle("is-active", other === el);
    // Move to the end so Escape closes the most recently touched window.
    const idx = order.indexOf(id);
    if (idx !== -1) order.splice(idx, 1);
    order.push(id);
  }

  /** The topmost window that is not minimized, or undefined if none is showing. */
  function topVisible() {
    for (let i = order.length - 1; i >= 0; i--) {
      if (!minimized.has(order[i])) return order[i];
    }
    return undefined;
  }

  function close(id) {
    const el = windows.get(id);
    if (!el) return;
    teardown(el);
    el.remove();
    windows.delete(id);
    minimized.delete(id);
    const idx = order.indexOf(id);
    if (idx !== -1) order.splice(idx, 1);
    renderTray();
    const next = topVisible();
    if (next) focus(next);
  }

  function minimize(id) {
    const el = windows.get(id);
    if (!el || minimized.has(id)) return;
    el.hidden = true;
    minimized.add(id);
    renderTray();
    const next = topVisible();
    if (next) focus(next);
  }

  function restore(id) {
    const el = windows.get(id);
    if (!el) return;
    el.hidden = false;
    minimized.delete(id);
    renderTray();
    focus(id);
  }

  /** Toggles a window between filling the screen and its previous geometry. */
  function toggleMax(id) {
    const el = windows.get(id);
    if (!el) return;
    const saved = restoreRects.get(el);
    if (saved) {
      Object.assign(el.style, saved);
      restoreRects.delete(el);
      el.classList.remove("is-max");
    } else {
      restoreRects.set(el, {
        left: el.style.left,
        top: el.style.top,
        width: el.style.width,
        height: el.style.height,
      });
      Object.assign(el.style, {
        left: "0px",
        top: "0px",
        width: `${layer.clientWidth}px`,
        height: `${layer.clientHeight}px`,
      });
      el.classList.add("is-max");
    }
    focus(id);
  }

  function renderTray() {
    tray.replaceChildren();
    for (const id of order) {
      if (!minimized.has(id)) continue;
      const el = windows.get(id);
      if (!el) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "win-tray-item";
      const icon = el.querySelector(".win-icon")?.textContent ?? "";
      const name = el.querySelector(".win-name")?.textContent ?? "";
      btn.textContent = `${icon} ${name}`.trim();
      btn.addEventListener("click", () => restore(id));
      tray.append(btn);
    }
    tray.hidden = minimized.size === 0;
  }

  /**
   * @param {object} opts
   * @param {string} opts.id     Stable id — reopening the same node focuses the
   *                             existing window instead of duplicating it.
   * @param {string} opts.title
   * @param {string} [opts.icon]
   * @param {HTMLElement} opts.content
   * @param {number} [opts.width]
   * @param {number} [opts.height]
   */
  function openWindow({ id, title, icon = "", content, width = 460, height = 320 }) {
    const existing = windows.get(id);
    if (existing) {
      // Swap the body so a re-open reflects fresh content. Tear the old content
      // down first (e.g. the media player stops its audio) so it doesn't linger.
      const body = existing.querySelector(".win-body");
      if (body) {
        callCleanup(body.firstElementChild);
        body.replaceChildren(content);
      }
      focus(id);
      return existing;
    }

    const el = document.createElement("section");
    el.className = "win";
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;

    const offset = (cascade % MAX_CASCADE) * CASCADE_STEP;
    cascade += 1;

    el.innerHTML = `
      <header class="win-bar">
        <span class="win-title"><span class="win-icon"></span><span class="win-name"></span></span>
        <span class="win-controls">
          <button class="win-min" type="button" aria-label="Minimize window" title="Minimize">–</button>
          <button class="win-max" type="button" aria-label="Maximize window" title="Maximize">▢</button>
          <button class="win-close" type="button" aria-label="Close window" title="Close">×</button>
        </span>
      </header>
      <div class="win-body"></div>
      <div class="win-resize" aria-hidden="true"></div>
    `;

    /** @type {HTMLElement} */ (el.querySelector(".win-icon")).textContent = icon;
    /** @type {HTMLElement} */ (el.querySelector(".win-name")).textContent = title;
    /** @type {HTMLElement} */ (el.querySelector(".win-body")).append(content);

    const onControl = (sel, fn) =>
      el.querySelector(sel).addEventListener("click", (e) => {
        e.stopPropagation();
        fn();
      });
    onControl(".win-min", () => minimize(id));
    onControl(".win-max", () => toggleMax(id));
    onControl(".win-close", () => close(id));

    // Double-clicking the titlebar maximizes/restores, as on a real desktop.
    el.querySelector(".win-bar").addEventListener("dblclick", (e) => {
      if (/** @type {HTMLElement} */ (e.target).closest(".win-controls")) return;
      toggleMax(id);
    });

    el.addEventListener("pointerdown", () => focus(id));

    makeDraggable(el, /** @type {HTMLElement} */ (el.querySelector(".win-bar")), layer);
    makeResizable(el, /** @type {HTMLElement} */ (el.querySelector(".win-resize")), layer);

    layer.append(el);

    // Clamp size/position on open so a window is never born bigger than, or off,
    // the screen (the drag handler only clamps once you grab it).
    const maxW = layer.clientWidth;
    const maxH = layer.clientHeight;
    if (el.offsetWidth > maxW) el.style.width = `${maxW}px`;
    if (el.offsetHeight > maxH) el.style.height = `${maxH}px`;
    el.style.left = `${clamp(offset, 0, Math.max(0, maxW - el.offsetWidth))}px`;
    el.style.top = `${clamp(offset, 0, Math.max(0, maxH - el.offsetHeight))}px`;

    windows.set(id, el);
    focus(id);
    return el;
  }

  return {
    openWindow,
    focus,
    close,
    hasWindows: () => windows.size > 0,
    /** Whether a window with this id is currently open (for dock indicators). */
    isOpen: (id) => windows.has(id),
    /** Closes the most recently focused *visible* window. Returns whether one
     *  was closed — so Escape closes windows before leaving the computer, but
     *  ignores minimized ones sitting in the tray. */
    closeTopWindow() {
      const id = topVisible();
      if (!id) return false;
      close(id);
      return true;
    },
    closeAll() {
      for (const id of [...windows.keys()]) close(id);
      minimized.clear();
      renderTray();
      cascade = 0;
    },
  };
}

/** Titlebar dragging, clamped inside the desktop bounds. */
function makeDraggable(el, handle, bounds) {
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;

  handle.addEventListener("pointerdown", (e) => {
    // Let the window-control buttons handle their own clicks.
    if (e.target.closest(".win-controls")) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    originX = el.offsetLeft;
    originY = el.offsetTop;
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp, { once: true });
    handle.addEventListener("pointercancel", onUp, { once: true });
  });

  function onMove(e) {
    const maxX = bounds.clientWidth - el.offsetWidth;
    const maxY = bounds.clientHeight - el.offsetHeight;
    el.style.left = `${clamp(originX + e.clientX - startX, 0, Math.max(0, maxX))}px`;
    el.style.top = `${clamp(originY + e.clientY - startY, 0, Math.max(0, maxY))}px`;
  }

  function onUp(e) {
    handle.releasePointerCapture?.(e.pointerId);
    handle.removeEventListener("pointermove", onMove);
  }
}

/**
 * Corner-grip resizing, clamped so a window stays usable and inside the desktop.
 */
function makeResizable(el, grip, bounds) {
  const MIN_W = 220;
  const MIN_H = 160;
  let startX = 0;
  let startY = 0;
  let originW = 0;
  let originH = 0;

  grip.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    grip.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    originW = el.offsetWidth;
    originH = el.offsetHeight;
    grip.addEventListener("pointermove", onMove);
    grip.addEventListener("pointerup", onUp, { once: true });
    grip.addEventListener("pointercancel", onUp, { once: true });
  });

  function onMove(e) {
    const maxW = bounds.clientWidth - el.offsetLeft;
    const maxH = bounds.clientHeight - el.offsetTop;
    el.style.width = `${clamp(originW + e.clientX - startX, MIN_W, maxW)}px`;
    el.style.height = `${clamp(originH + e.clientY - startY, MIN_H, maxH)}px`;
  }

  function onUp(e) {
    grip.releasePointerCapture?.(e.pointerId);
    grip.removeEventListener("pointermove", onMove);
  }
}

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

/** Runs an app's optional `__cleanup` hook — apps holding live resources (the
 *  media player's <audio>) set it so we can release them on close/swap. */
function callCleanup(node) {
  if (node && typeof node.__cleanup === "function") node.__cleanup();
}

/** Tears down whatever app content a window currently holds. */
function teardown(winEl) {
  callCleanup(winEl.querySelector(".win-body")?.firstElementChild);
}
