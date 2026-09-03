import { defineConfig } from "vite";

// base "./" keeps the build portable (works from a subdirectory, e.g. GitHub Pages
// project sites). Asset URLs must go through asset() in src/paths.js to match.
export default defineConfig({
  base: "./",
  build: {
    // Keep bundler output out of public/assets/, which is copied to dist/assets/
    // verbatim. Sharing one directory makes it hard to tell game assets from
    // build artefacts when something 404s.
    assetsDir: "build",
  },
});
