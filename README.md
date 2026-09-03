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

**Controls:** WASD / arrow keys to move, `E` (or Space / Enter) to examine,
`Esc` to back out of anything.

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
`text` (light markdown), `image` and `link`. To support a new type, add a
renderer in `src/ui/desktop/apps/` and register it in the `APPS` map in
`src/ui/desktop/index.js`.

## Design notes

**The desktop is DOM, not canvas.** It is layered over the WebGL canvas rather
than drawn into it. Scrolling, text selection and real `<a href>` links all come
from the platform instead of being reimplemented at 320×240.

**One input lock.** `src/uiState.js` holds a stack of open overlays. The player's
update loop and every interact handler check it, so the character cannot walk
around while you are reading. A short cooldown after closing stops the dismiss
keypress from immediately reopening the same object.

**The camera is fixed.** The room is one 20×15 tile space rendered at a 320×240
virtual resolution and letterboxed up to the window, so the whole room is always
framed. If a second floor is ever added, swap in `k.setCamPos(player.pos)`.

## Status

Playable end to end with placeholder art. Still to do:

- [ ] Real art (see `CREDITS.md` for the chosen CC0 packs) and a Tiled-drawn room
- [ ] Replace all `TODO(nathan)` copy in `src/content.js`
- [ ] Mobile touch controls, deploy workflow, audio — deliberately deferred
