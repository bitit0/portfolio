/** @param {import("../../../content.js").VfsNode} node */
export function imageViewer(node) {
  const el = document.createElement("div");
  el.className = "app-image";

  const img = document.createElement("img");
  img.src = node.src ?? "";
  img.alt = node.name;
  img.decoding = "async";

  // Say so on a missing image, rather than showing a broken-image glyph.
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
