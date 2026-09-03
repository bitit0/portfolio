/**
 * Resolve a path inside public/ against the Vite base URL.
 *
 * Needed because vite.config.js sets `base: "./"`, so absolute "/assets/..."
 * URLs would break on any non-root deployment.
 *
 * Spaces are percent-encoded: the asset packs ship folders like
 * "Ninja Adventure - Asset Pack", and a raw space is not legal in a URL path.
 * Encoding beats renaming the folders, because map.json's embedded tileset
 * paths point at the original names and Tiled would have to be re-pointed.
 *
 * @param {string} p
 * @returns {string}
 */
export function asset(p) {
  return `${import.meta.env.BASE_URL}${p.replace(/^\/+/, "")}`.replace(/ /g, "%20");
}
