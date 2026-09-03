import k from "./kaplayCtx.js";
import { asset } from "./paths.js";
import { loadGameAssets } from "./assets.js";
import { registerRoomScene } from "./scenes/room.js";
import "./ui/styles/base.css";
import "./ui/styles/dialogue.css";
import "./ui/styles/desktop.css";
import "./ui/styles/credits.css";

/**
 * Boot. The map is fetched up front rather than through kaplay's asset loader
 * so the scene receives plain JSON and stays testable without a game context.
 */
async function main() {
  const res = await fetch(asset("assets/map.json"));
  if (!res.ok) throw new Error(`failed to load map.json: ${res.status}`);
  const map = await res.json();

  loadGameAssets(map);
  registerRoomScene();

  // The room CANNOT be built before loading finishes. loadSpriteAtlas only
  // registers its named cuts once the image has decoded, so calling
  // k.sprite("bed") any earlier throws on a null asset. Registering onLoad in
  // the same tick as loadGameAssets() means it cannot miss the event.
  k.onLoad(() => {
    k.go("room", map);
    // kaplay binds key events to the canvas, so without focus the game is
    // unresponsive until the user happens to click it.
    document.getElementById("game")?.focus();
  });

  k.onLoadError((name, failed) => {
    console.error(`[assets] failed to load "${name}"`, failed.error);
  });
}

main().catch((err) => {
  console.error(err);
  document.body.insertAdjacentHTML(
    "beforeend",
    `<pre style="position:fixed;inset:1rem;z-index:999;color:#f88;background:#111;padding:1rem;overflow:auto">${err.stack ?? err}</pre>`,
  );
});
