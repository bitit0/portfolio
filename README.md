# Portfolio — a room you walk around in

A developer portfolio built as a small 2D game: a single top-down bedroom where
every object can be examined, and the computer opens a fake desktop OS holding
the actual portfolio content.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview  # serve the production build
```

**Controls:** WASD / arrow keys to move, hold `Shift` to run, `F` (or Space /
Enter) to examine, `Esc` to back out of anything. On touch devices an on-screen
joystick and interact button appear automatically.

## Where things live

| I want to… | Edit |
| --- | --- |
| Change what an object says | `src/content.js` → `DIALOGUE` |
| Change what is on the computer | `src/content.js` → `VFS` |
| Move furniture, add an object | `public/assets/map.json` |
| Change placeholder colours | `src/placeholderArt.js` |

### Adding a new examinable object

No engine code required:

1. Add a rect to the `objects` layer in `public/assets/map.json`.
2. Add an entry under the same `name` to `DIALOGUE` in `src/content.js`.

The room scene reads the map at runtime and wires the two together by name. A
map object with no dialogue entry logs a warning rather than failing silently.

### Adding a file to the computer

Add a node to `VFS` in `src/content.js`. Supported `type` values are `dir`,
`text` (light markdown), `image`, `pdf` and `link`. To support a new type, add a
renderer in `src/ui/desktop/apps/` and register it in the `APPS` map in
`src/ui/desktop/index.js`. Standalone apps that aren't tied to a file (the
Browser and Media Player) are pinned to the dock via the `LAUNCHERS` list in the
same file.

## Design notes

**The desktop is DOM, not canvas.** It is layered over the WebGL canvas rather
than drawn into it. Scrolling, text selection and real `<a href>` links all come
from the platform instead of being reimplemented at 320×240.

**One input lock.** `src/uiState.js` holds a stack of open overlays. The player's
update loop and every interact handler check it, so the character cannot walk
around while you are reading. A short cooldown after closing stops the dismiss
keypress from immediately reopening the same object.

**The camera is fixed.** The room is one small tile space and `src/camera.js`
zooms it to fit the window. The canvas renders at the window's native resolution
rather than upscaling a low-res framebuffer — that is what keeps the desktop's
text sharp. If a second floor is ever added, swap in `k.setCamPos(player.pos)`.

## Status

Playable end to end: a cyberpunk room drawn in Tiled with eight examinable
objects, and a desktop OS — file explorer, text / image / PDF viewers, a
bookmark browser and a media player. Touch controls, a GitHub Pages deploy
workflow and audio are all in.
