import k from "./kaplayCtx.js";
import { asset } from "./paths.js";
import { loadGameAssets } from "./assets.js";
import { registerRoomScene } from "./scenes/room.js";
import { mountTouchControls } from "./ui/touchControls.js";
import { mountBootScreen } from "./ui/bootScreen.js";
import { mountTextFallback } from "./ui/textFallback.js";
import { mountQuestLog } from "./ui/questLog.js";
import "./ui/styles/base.css";
import "./ui/styles/dialogue.css";
import "./ui/styles/desktop.css";
import "./ui/styles/credits.css";
import "./ui/styles/touch.css";
import "./ui/styles/boot.css";
import "./ui/styles/quest.css";

/** Boot. The map is fetched as plain JSON (not via kaplay's loader) so the scene
 *  stays testable without a game context. */
async function main() {
  mountBootScreen(); // masks the blank canvas while assets load
  mountTextFallback(); // hidden, crawlable/screen-reader version of the content
  mountQuestLog();

  const res = await fetch(asset("assets/map.json"));
  if (!res.ok) throw new Error(`failed to load map.json: ${res.status}`);
  const map = await res.json();

  loadGameAssets(map);
  registerRoomScene();
  mountTouchControls();

  // Build the room only once assets have decoded — sprite cuts register on load,
  // so k.sprite() any earlier throws. Registering onLoad now can't miss the event.
  k.onLoad(() => {
    k.go("room", map);
    document.getElementById("game")?.focus(); // kaplay reads keys off the canvas
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
