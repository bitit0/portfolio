/**
 * Views a PDF in an <iframe> — the browser's built-in viewer handles scroll,
 * zoom, print and download.
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

  // Missing file or a browser that blocks inline PDFs: offer it as a link.
  frame.addEventListener("error", () => showFallback());
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
