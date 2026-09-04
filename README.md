# Portfolio — a room you walk around in

A developer portfolio built as a small 2D game: a top-down room you explore, where
every object can be examined and the computer boots a fake desktop OS holding the
real content — résumé, project write-ups, links.

Live at **[bitit0.github.io/portfolio](https://bitit0.github.io/portfolio/)**.

## Stack

- **[Kaplay](https://kaplayjs.com/)** — 2D game engine (canvas / WebGL) for the room
- **[Vite](https://vite.dev/)** — dev server and build
- **Plain DOM + CSS** — the desktop OS, dialogue and HUD are layered over the canvas,
  so scrolling, text selection and real links come for free
- **[Tiled](https://www.mapeditor.org/)** — the room is a `map.json`, loaded at runtime
- Vanilla JS with JSDoc; ESLint + Prettier, auto-formatted on commit

## Controls

WASD / arrows to move, hold `Shift` to run, `F` (or Space / Enter) to examine, `Esc`
to back out. On touch devices an on-screen joystick and button appear automatically.

## Develop

```
npm install
npm run dev       # http://localhost:5173
npm run build     # -> dist/
```

Deployed to GitHub Pages on every push to `main`.
