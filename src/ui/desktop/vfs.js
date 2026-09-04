/**
 * Helpers over the virtual filesystem declared in src/content.js.
 * The tree is plain data; these only read it.
 */

/** @typedef {import("../../content.js").VfsNode} VfsNode */

const ICONS = {
  dir: "🗂",
  text: "📄",
  image: "🖼",
  pdf: "📕",
  link: "🔗",
};

/** @param {VfsNode} node */
export function iconFor(node) {
  return ICONS[node.type] ?? "📄";
}

/** @param {VfsNode} node */
export function childrenOf(node) {
  return node.children ?? [];
}

/** Stable, path-based id keying a node's window (reopening focuses, not duplicates).
 *  @param {string[]} pathNames */
export function idForPath(pathNames) {
  return pathNames.join("/");
}

/** Folders first, then alphabetical — the ordering people expect. */
export function sortNodes(nodes) {
  return [...nodes].sort((a, b) => {
    if (a.type === "dir" && b.type !== "dir") return -1;
    if (b.type === "dir" && a.type !== "dir") return 1;
    return a.name.localeCompare(b.name);
  });
}
