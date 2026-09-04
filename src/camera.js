import k from "./kaplayCtx.js";

/** Zooms so the whole room fits the viewport — a fixed space, so the camera
 *  never follows the player. fixed() UI ignores the zoom and stays sharp. */
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
