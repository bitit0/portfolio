/**
 * Every piece of user-facing copy in the portfolio lives here.
 *
 * Nothing in this file is engine code — editing your portfolio should never
 * mean touching a scene or an entity. Adding a new examinable object is:
 *   1. add a rect to the "objects" layer in public/assets/map.json
 *   2. add an entry here under the same name
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
    lines: ["The city of Boston, buzzing along."],
  },
  shelf: {
    label: "Shelf",
    lines: [
      "Your tools, in rough order of hours logged:",
      "Python · C# · C++ · Java",
      "JavaScript · React · TypeScript",
      "Docker · Git · Windows · Linux",
      "Claude · Codex",
    ],
  },
  fridge: {
    label: "Fridge",
    lines: ["Sushi, tacos, pho, with cans of cold, crisp, Coca-Cola."],
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
    ],
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
 *   pdf   → PDF viewer (browser-native, in an iframe)
 *   link  → opens in a real browser tab
 *
 * @typedef {object} VfsNode
 * @property {string} name
 * @property {"dir" | "text" | "image" | "pdf" | "link"} type
 * @property {VfsNode[]} [children]
 * @property {string} [body]
 * @property {string} [src]
 * @property {string} [href]
 */

/** @type {VfsNode} */
export const VFS = {
  name: "NATHAN.OS",
  type: "dir",
  children: [
    {
      name: "readme.md",
      type: "text",
      body: [
        "# Hey, I'm Nathan",
        "",
        "I'm a software engineer in Boston who likes building things people actually use - tools, dashboards, games, whatever the problem calls for.",
        "",
        "Take a look around, everything in this room is clickable. The projects, a bit about me, and how to reach me are all here to explore.",
        "",
        "**Start with** `projects/` or open `resume.pdf`.",
      ].join("\n"),
    },
    {
      name: "resume.pdf",
      type: "pdf",
      src: asset("assets/resume.pdf"),
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
            "The interesting decision was rendering this desktop as plain DOM layered over the canvas instead of drawing it in WebGL. Canvas gives you pixels; it does not give you scrolling, text selection, or real links — those would all have been reimplemented by hand.",
            "",
            "The room itself is defined as a `map.json` in Tiled's format, so adding an object is data, not code.",
            "",
            "- `src/scenes/room.js` builds the room from the map",
            "- `src/ui/desktop/` is this thing you are reading",
          ].join("\n"),
        },
        {
          name: "process-monitor.md",
          type: "text",
          body: [
            "# Windows Process Monitor",
            "",
            "A native Windows system monitor with a live, hierarchical process tree — CPU, memory, disk I/O, thread and handle counts for hundreds of processes, all refreshed every second.",
            "",
            "- Built the parent-child tree with `MVVM` and incremental `ObservableCollection` syncing, so only what actually changes redraws.",
            "- Pulled process relationships, disk activity, command-line arguments and hardware details straight from `P/Invoke` and `WMI` — data the standard .NET APIs never expose.",
            "- Drew five real-time charts (CPU, memory, disk, network, GPU) on a custom WPF `Canvas` with auto-scaling axes and a rolling two-minute history.",
            "",
            "**Stack:** C# · WPF · .NET · P/Invoke · WMI",
          ].join("\n"),
        },
        {
          name: "collab-notes.md",
          type: "text",
          body: [
            "# Real-Time Collaborative Notes",
            "",
            "A full-stack note-taking platform where several people edit the same document at once and see each other's changes live.",
            "",
            "- Handled low-latency synchronization and conflict resolution so a document stays consistent through concurrent edits.",
            "- Built REST APIs for notes, authentication and collaboration workflows, with role-based access control.",
            "",
            "**Stack:** React · Express.js · Firestore · Node.js",
          ].join("\n"),
        },
        {
          name: "typing-game.md",
          type: "text",
          body: [
            "# Music-Based Typing Game",
            "",
            "A typing game that pulls real songs from the YouTube and Spotify APIs and turns them into live, rhythm-driven gameplay.",
            "",
            "- Wired the YouTube and Spotify APIs together for dynamic song content and real-time play.",
            "- Built a responsive interface with React, Chakra UI and React Router.",
            "- Managed client-side state with Zustand to keep the app maintainable as it grew.",
            "",
            "**Stack:** React · Chakra UI · Zustand · YouTube API · Spotify API",
          ].join("\n"),
        },
        {
          name: "emotion-recognizer.md",
          type: "text",
          body: [
            "# Live Emotion Recognizer",
            "",
            "A computer-vision project that reads facial expressions from a live webcam feed and labels the emotion on screen in real time.",
            "",
            "- Trained a convolutional neural network in `TensorFlow`/`Keras` on the FER2013 dataset to classify the seven standard expressions — angry, disgust, fear, happy, sad, surprise and neutral.",
            "- Detects faces frame by frame with an `OpenCV` Haar cascade, then feeds each cropped face to the model for a live prediction.",
            "- Runs continuously on video rather than single images, so the label tracks your expression as it changes.",
            "",
            "**Stack:** Python · TensorFlow · Keras · OpenCV",
            "",
            "[github.com/bitit0/emotionRecognition](https://github.com/bitit0/emotionRecognition)",
          ].join("\n"),
        },
        {
          name: "automata-toolkit.md",
          type: "text",
          body: [
            "# Formal Languages Toolkit",
            "",
            "A from-scratch automata-theory library in C++.",
            "",
            "- Templated `DFA` and `NFA` classes over arbitrary state types, with the full set of closure operations — union, intersection and complement.",
            "- Compiles regular expressions into NFAs and converts NFAs back to DFAs, then tests strings for acceptance.",
            "- Enumerates strings over an alphabet to exercise a machine against the language it recognizes.",
            "",
            "**Stack:** C++",
            "",
            "[github.com/bitit0/umlFoCS](https://github.com/bitit0/umlFoCS)",
          ].join("\n"),
        },
        {
          name: "diablo4-scripts.md",
          type: "text",
          body: [
            "# Diablo IV Automation Scripts",
            "",
            "A suite of AutoHotkey v2 automation tools for Diablo IV that drive the game entirely through computer vision and OS-level input — no memory reads, no injected code. Because every action runs on screen scraping (`PixelSearch`, GDI+ captures, OCR) and background `ControlSend`/`ControlClick` messages rather than touching the game process, it leaves no footprint for the anti-cheat to flag and never has to pull the window to the foreground.",
            "",
            "- **Charm reroller (with GUI):** an always-on-top control panel where I type the affix I'm after; the script rerolls in a loop, captures the result region with `GDI+`, runs it through `Tesseract` OCR, and halts the instant the recognized text matches the target — turning a blind gamble into a targeted search.",
            "- **Auto-fisher:** resolution-aware `PixelSearch` locks onto the bite colour on whichever monitor the game is on and reels in with randomized, human-like timing. Paired with a watchdog that auto-logs back in and relaunches the game on a crash, disconnect or kick, it ran unattended for hundreds of hours with zero downtime — and pinged a Discord webhook the moment a rare dropped.",
            "- **Transfigure macros:** hotkeys that execute a precise click sequence through the crafting UI and restore the cursor to where it started, collapsing a repetitive upgrade flow into a single keypress.",
            "",
            "Every script scales its coordinates from a 1920×1080 base to the live resolution and targets the game window directly, so the same code works across resolutions and multi-monitor setups.",
            "",
            "**Stack:** AutoHotkey v2 · Tesseract OCR · GDI+ · PixelSearch · WinHTTP",
          ].join("\n"),
        },
        {
          name: "minecraft-plugin.md",
          type: "text",
          body: [
            "# Minecraft Server Plugin",
            "",
            "A custom Bukkit/Spigot plugin I built for my own server — purpose-made to replace the bloated all-in-one plugins with only the commands we actually used, tuned so none of them stall the server tick.",
            "",
            "- Homes, warps and teleports: `/sethome`, `/home`, `/spawn`, `/tpa` requests, named `/warp` destinations and starter `/kit` loadouts on cooldowns.",
            "- Optimized for my server: player homes and cooldowns are cached in memory and flushed to disk asynchronously, so a teleport never blocks the main thread on a file read the way a general-purpose plugin would.",
            "- Trimmed to exactly what my community needed, which kept the jar tiny and tick times flat even during peak activity.",
            "",
            "**Stack:** Java · Spigot API",
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
    { name: "Email", type: "link", href: "mailto:nathan.ngo44@gmail.com" },
  ],
};

/**
 * Bookmarks shown on the in-OS web browser's start page. Clicking one opens the
 * real site in a new browser tab (framing most sites is blocked by their
 * headers, so the browser is a launcher, not an embedded view).
 *
 * @type {{ label: string, href: string, glyph?: string }[]}
 */
export const BOOKMARKS = [
  { label: "GitHub", href: "https://github.com/bitit0", glyph: "🐙" },
  { label: "LinkedIn", href: "https://linkedin.com/in/nathanvanngo", glyph: "💼" },
  { label: "Email", href: "mailto:nathan.ngo44@gmail.com", glyph: "✉️" },
];

/**
 * Tracks for the in-OS media player.
 *
 * Drop audio files in public/assets/music/ and list them here — the player
 * reads this array. Formats the browser plays natively (mp3, m4a, ogg) work
 * best. Note that anything listed here ships publicly with the site, so only
 * include music you have the right to distribute.
 *
 * @typedef {object} Track
 * @property {string} title
 * @property {string} [artist]
 * @property {string} src
 *
 * @type {Track[]}
 */
export const PLAYLIST = [
  // { title: "Track Name", artist: "Artist", src: asset("assets/music/track.mp3") },
  {
    title: "Don't Dream It's Over",
    artist: "Crowded House",
    src: asset("assets/music/crowded-house-dont-dream-its-over.mp3"),
  },
  { title: "Always", artist: "Daniel Caesar", src: asset("assets/music/daniel-caesar-always.mp3") },
  {
    title: "Roses",
    artist: "The Chainsmokers",
    src: asset("assets/music/the-chainsmokers-roses.mp3"),
  },
  { title: "love.", artist: "wave to earth", src: asset("assets/music/wave-to-earth-love.mp3") },
];
