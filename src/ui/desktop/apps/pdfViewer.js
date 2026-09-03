/**
 * Views a PDF node. The browser's built-in PDF viewer does the real work —
 * scroll, zoom, print and download all come free from an <iframe>, the same
 * "let the platform handle it" approach the rest of this desktop uses.
 *
 * @param {import("../../../content.js").VfsNode} node
 */
export function pdfViewer(node) {
  const el = document.createElement("div");
  el.className = "app-pdf";

  const frame = document.createElement("iframe");
  frame.src = node.src ?? "";
  frame.title = node.name;
  frame.loading = "lazy";
  el.append(frame);

  // A missing file should say so with a download link, not show an empty frame.
  frame.addEventListener("error", () => showFallback());
  // Some browsers block inline PDF rendering; offer the file directly if so.
  function showFallback() {
    el.replaceChildren(
      Object.assign(document.createElement("p"), {
        className: "app-empty",
        innerHTML: `Could not display ${node.name}. <a href="${node.src}" target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.`,
      }),
    );
  }

  return el;
}
