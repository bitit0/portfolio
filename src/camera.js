import k from "./kaplayCtx.js";

/**
 * Frames the whole room in the viewport.
 *
 * The room is a single fixed space, so the camera never follows the player — it
 * just zooms so the room fits. World sprites scale up with the zoom (pixel art
 * stays chunky, which is the point); anything with fixed() ignores the zoom and
 * renders at native screen resolution.
 */
export function fitRoomToViewport(roomWidth, roomHeight) {
  const scale = Math.min(k.width() / roomWidth, k.height() / roomHeight);
  k.setCamScale(scale);
  k.setCamPos(k.vec2(roomWidth / 2, roomHeight / 2));
  return scale;
}

/** Fits now and re-fits whenever the window changes size. */
export function setupCamera(roomWidth, roomHeight) {
  const fit = () => fitRoomToViewport(roomWidth, roomHeight);
  fit();
  k.onResize(fit);
}
