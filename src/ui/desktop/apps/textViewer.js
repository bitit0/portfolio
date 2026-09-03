/**
 * Renders a text node as light markdown.
 *
 * Intentionally a hand-rolled subset rather than a markdown dependency: the
 * content is ours, the supported syntax is fixed, and this keeps the bundle to
 * the game engine alone.
 *
 * Supports: # ## ###, - lists, ``` fences, **bold**, `code`, [text](url).
 */

/** @param {import("../../../content.js").VfsNode} node */
export function textViewer(node) {
  const el = document.createElement("article");
  el.className = "app-text";
  el.innerHTML = renderMarkdown(node.body ?? "");

  for (const a of el.querySelectorAll("a")) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  return el;
}

export function renderMarkdown(src) {
  const lines = src.split("\n");
  const out = [];
  let listBuffer = [];
  let inFence = false;
  let fenceBuffer = [];

  const flushList = () => {
    if (!listBuffer.length) return;
    out.push(`<ul>${listBuffer.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`);
    listBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");

    if (line.trim().startsWith("```")) {
      if (inFence) {
        out.push(`<pre><code>${escapeHtml(fenceBuffer.join("\n"))}</code></pre>`);
        fenceBuffer = [];
      } else {
        flushList();
      }
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      fenceBuffer.push(raw);
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const item = /^\s*[-*]\s+(.*)$/.exec(line);
    if (item) {
      listBuffer.push(item[1]);
      continue;
    }

    if (!line.trim()) {
      flushList();
      continue;
    }

    flushList();
    out.push(`<p>${inline(line)}</p>`);
  }

  // An unterminated fence still renders rather than swallowing the rest.
  if (inFence && fenceBuffer.length) {
    out.push(`<pre><code>${escapeHtml(fenceBuffer.join("\n"))}</code></pre>`);
  }
  flushList();
  return out.join("");
}

/** Escaping happens first, so no author markup can inject raw HTML. */
function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}
