/** @param {import("../../../content.js").VfsNode} node */
export function imageViewer(node) {
  const el = document.createElement("div");
  el.className = "app-image";

  const img = document.createElement("img");
  img.src = node.src ?? "";
  img.alt = node.name;
  img.decoding = "async";

  // A missing screenshot should say so, not render a broken-image glyph in the
  // middle of the portfolio.
  img.addEventListener("error", () => {
    el.replaceChildren(
      Object.assign(document.createElement("p"), {
        className: "app-empty",
        textContent: `Could not load ${node.name}`,
      }),
    );
  });

  el.append(img);
  return el;
}
