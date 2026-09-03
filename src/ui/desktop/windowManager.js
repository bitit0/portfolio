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
  let zTop = 100;
  let cascade = 0;

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

  function close(id) {
    const el = windows.get(id);
    if (!el) return;
    el.remove();
    windows.delete(id);
    const idx = order.indexOf(id);
    if (idx !== -1) order.splice(idx, 1);
    const next = order[order.length - 1];
    if (next) focus(next);
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
      // Swap the body so a re-open reflects fresh content, then just focus.
      const body = existing.querySelector(".win-body");
      if (body) body.replaceChildren(content);
      focus(id);
      return existing;
    }

    const el = document.createElement("section");
    el.className = "win";
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;

    const offset = (cascade % MAX_CASCADE) * CASCADE_STEP;
    cascade += 1;
    el.style.left = `${offset}px`;
    el.style.top = `${offset}px`;

    el.innerHTML = `
      <header class="win-bar">
        <span class="win-title"><span class="win-icon"></span><span class="win-name"></span></span>
        <button class="win-close" type="button" aria-label="Close window">×</button>
      </header>
      <div class="win-body"></div>
    `;

    /** @type {HTMLElement} */ (el.querySelector(".win-icon")).textContent = icon;
    /** @type {HTMLElement} */ (el.querySelector(".win-name")).textContent = title;
    /** @type {HTMLElement} */ (el.querySelector(".win-body")).append(content);

    el.querySelector(".win-close").addEventListener("click", (e) => {
      e.stopPropagation();
      close(id);
    });
    el.addEventListener("pointerdown", () => focus(id));

    makeDraggable(el, /** @type {HTMLElement} */ (el.querySelector(".win-bar")), layer);

    layer.append(el);
    windows.set(id, el);
    focus(id);
    return el;
  }

  return {
    openWindow,
    focus,
    close,
    hasWindows: () => windows.size > 0,
    /** Closes the most recently focused window. Returns whether one was closed. */
    closeTopWindow() {
      const id = order[order.length - 1];
      if (!id) return false;
      close(id);
      return true;
    },
    closeAll() {
      for (const id of [...windows.keys()]) close(id);
      cascade = 0;
    },
  };
}

/**
 * Titlebar dragging, clamped so a window can never be dragged somewhere it
 * cannot be dragged back from.
 */
function makeDraggable(el, handle, bounds) {
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;

  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".win-close")) return;
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

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}
