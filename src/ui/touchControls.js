/**
 * On-screen gamepad for touch devices: a floating joystick (left) and interact
 * button (right), overlaid on the canvas so it works in any orientation. Shown
 * only on touch devices (coarse pointer, no hover); desktop stays keyboard-only.
 */

import { setMove, clearMove, fireInteract } from "../touchInput.js";

const STICK_RADIUS = 48; // px the knob can travel from the base

export function mountTouchControls() {
  const isTouch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (!isTouch) return;

  const pad = document.createElement("div");
  pad.id = "touchpad";
  pad.setAttribute("aria-hidden", "true");
  pad.innerHTML = `
    <div class="tp-move"></div>
    <div class="tp-stick" hidden><div class="tp-knob"></div></div>
    <button class="tp-action" type="button" aria-label="Interact">F</button>
  `;
  document.body.append(pad);

  const zone = /** @type {HTMLElement} */ (pad.querySelector(".tp-move"));
  const stick = /** @type {HTMLElement} */ (pad.querySelector(".tp-stick"));
  const knob = /** @type {HTMLElement} */ (pad.querySelector(".tp-knob"));
  const action = /** @type {HTMLButtonElement} */ (pad.querySelector(".tp-action"));

  let originX = 0;
  let originY = 0;
  let stickPointer = null;

  zone.addEventListener("pointerdown", (e) => {
    stickPointer = e.pointerId;
    originX = e.clientX;
    originY = e.clientY;
    stick.style.left = `${originX}px`;
    stick.style.top = `${originY}px`;
    stick.hidden = false;
    knob.style.transform = "translate(0px, 0px)";
    zone.setPointerCapture(e.pointerId);
  });

  zone.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stickPointer) return;
    let dx = e.clientX - originX;
    let dy = e.clientY - originY;
    const dist = Math.hypot(dx, dy);
    if (dist > STICK_RADIUS) {
      dx = (dx / dist) * STICK_RADIUS;
      dy = (dy / dist) * STICK_RADIUS;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    setMove(dx / STICK_RADIUS, dy / STICK_RADIUS);
  });

  const endStick = (e) => {
    if (e.pointerId !== stickPointer) return;
    stickPointer = null;
    stick.hidden = true;
    clearMove();
  };
  zone.addEventListener("pointerup", endStick);
  zone.addEventListener("pointercancel", endStick);

  // pointerdown (not click) so it fires instantly and can share a multitouch
  // gesture with the joystick thumb.
  action.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    action.classList.add("is-down");
    fireInteract();
  });
  const releaseAction = () => action.classList.remove("is-down");
  action.addEventListener("pointerup", releaseAction);
  action.addEventListener("pointercancel", releaseAction);
  action.addEventListener("pointerleave", releaseAction);

  // Hide the whole pad whenever a DOM overlay (dialogue / computer) is open —
  // movement is frozen then anyway, and the overlay handles its own input.
  const overlays = ["dialogue", "desktop"].map((id) => document.getElementById(id));
  const syncVisible = () => {
    const anyOpen = overlays.some((el) => el && !el.hidden);
    pad.classList.toggle("is-hidden", anyOpen);
    if (anyOpen && stickPointer !== null) {
      stickPointer = null;
      stick.hidden = true;
      clearMove();
    }
  };
  const observer = new MutationObserver(syncVisible);
  for (const el of overlays) {
    if (el) observer.observe(el, { attributes: true, attributeFilter: ["hidden"] });
  }
  syncVisible();
}
