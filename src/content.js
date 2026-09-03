/**
 * Every piece of user-facing copy in the portfolio lives here.
 *
 * Nothing in this file is engine code — editing your portfolio should never
 * mean touching a scene or an entity. Adding a new examinable object is:
 *   1. add a rect to the "objects" layer in public/assets/map.json
 *   2. add an entry here under the same name
 *
 * TODO(nathan): everything below is placeholder copy. Replace it.
 */

import { asset } from "./paths.js";

/**
 * @typedef {object} DialogueEntry
 * @property {string} label     Shown in the interact prompt, e.g. "F · Bed".
 * @property {string[]} lines   One string per dialogue page.
 * @property {{ label: string, href: string }[]} [links] Rendered on the last page.
 */

/**
 * Only the objects listed here are examinable. Everything else in the room is
 * scenery — drawn and solid, but silent. To make something examinable, give it
 * a matching name in Tiled and add an entry below; to silence something, remove
 * its entry.
 *
 * @type {Record<string, DialogueEntry>}
 */
export const DIALOGUE = {
  computer: {
    label: "Computer",
    // Never shown — the computer opens the desktop overlay instead of a
    // dialogue. Kept so the prompt has a label and the key is documented.
    lines: [],
  },
  window: {
    label: "Window",
    lines: [
      "The city of Boston, buzzing along.",
    ],
  },
  shelf: {
    label: "Shelf",
    lines: [
      "Your tools, in rough order of hours logged:",
      "Python · C# · C++ · Java",
      "JavaScript · React · TypeScript",
      "Docker · Git · Windows · Linux",
      "Claude · Codex"
    ],
  },
  fridge: {
    label: "Fridge",
    lines: [
      "Sushi, tacos, pho, with cans of cold, crisp, Coca-Cola.",
    ],
  },
  bed: {
    label: "Bed",
    lines: [
      "A bed, made with more care than usual.",
      "Sleeping here would restore your HP. Unfortunately there is work to do.",
    ],
  },
  closet: {
    label: "Closet",
    lines: [
      "Four identical jackets. Decision fatigue is a real thing.",
      "Lots of neutral color sweatshirts.",
    ]
  },
  mailbox: {
    label: "Terminal",
    lines: ["A comms terminal. This is how you reach me."],
    links: [
      { label: "GitHub", href: "https://github.com/bitit0" },
      { label: "Email", href: "mailto:nathan.ngo44@gmail.com" },
      { label: "LinkedIn", href: "https://linkedin.com/in/nathanvanngo" },
    ],
  },
  door: {
    label: "Door",
    lines: ["It is not time to touch grass yet."],
  },
};

/**
 * The in-game computer's filesystem.
 *
 * Node types drive which app opens it, see src/ui/desktop/apps/.
 *   dir   → file explorer navigates into it
 *   text  → text viewer (light markdown: #, ##, **bold**, `code`, -, [a](b))
 *   image → image viewer
 *   link  → opens in a real browser tab
 *
 * @typedef {object} VfsNode
 * @property {string} name
 * @property {"dir" | "text" | "image" | "link"} type
 * @property {VfsNode[]} [children]
 * @property {string} [body]
 * @property {string} [src]
 * @property {string} [href]
 */

/** @type {VfsNode} */
export const VFS = {
  name: "NATE.OS",
  type: "dir",
  children: [
    {
      name: "readme.md",
      type: "text",
      body: [
        "# Hey, I'm Nathan",
        "",
        "You are standing in my room. Everything in here is clickable.",
        "",
        "This machine holds the parts a resume normally flattens: the projects,",
        "what actually went wrong in them, and how to reach me.",
        "",
        "**Start with** `projects/` or open `resume.md`.",
        "",
        "TODO(nathan): replace this with your own intro.",
      ].join("\n"),
    },
    {
      name: "resume.md",
      type: "text",
      body: [
        "# Nathan",
        "## Software Engineer",
        "",
        "## Experience",
        "- **Your Role** — Company (20XX–present)",
        "  - Shipped a thing. Explain the impact, not the ticket.",
        "  - Owned another thing end to end.",
        "",
        "## Skills",
        "- JavaScript, TypeScript, React, Node",
        "- Python, Postgres, Docker, Linux",
        "",
        "## Education",
        "- Your school, your program",
        "",
        "TODO(nathan): this is a skeleton. Fill it in.",
      ].join("\n"),
    },
    {
      name: "projects",
      type: "dir",
      children: [
        {
          name: "this-portfolio.md",
          type: "text",
          body: [
            "# This portfolio",
            "",
            "A 2D room you walk around in, built with **Kaplay** and **Vite**.",
            "",
            "The interesting decision was rendering this desktop as plain DOM",
            "layered over the canvas instead of drawing it in WebGL. Canvas gives",
            "you pixels; it does not give you scrolling, text selection, or real",
            "links. Those would all have been reimplemented by hand.",
            "",
            "The room is defined as a `map.json` in Tiled's format, so adding an",
            "object is data, not code.",
            "",
            "- `src/scenes/room.js` builds the room from the map",
            "- `src/ui/desktop/` is this thing you are reading",
          ].join("\n"),
        },
        {
          name: "project-two.md",
          type: "text",
          body: [
            "# Project Two",
            "",
            "TODO(nathan): what it was, what was hard, what you'd do differently.",
            "",
            "The third question is the one people actually remember.",
          ].join("\n"),
        },
      ],
    },
    {
      name: "photos",
      type: "dir",
      children: [
        {
          name: "screenshot.png",
          type: "image",
          src: asset("assets/shots/placeholder.png"),
        },
      ],
    },
    { name: "GitHub", type: "link", href: "https://github.com/bitit0" },
    { name: "Email", type: "link", href: "mailto:you@example.com" },
  ],
};
