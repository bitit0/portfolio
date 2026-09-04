/**
 * Resolve a path inside public/ against the Vite base URL (base is "./", so
 * absolute "/assets/..." would break on a subpath deploy). Spaces are encoded
 * because some asset folders contain them.
 *
 * @param {string} p
 * @returns {string}
 */
export function asset(p) {
  return `${import.meta.env.BASE_URL}${p.replace(/^\/+/, "")}`.replace(/ /g, "%20");
}
