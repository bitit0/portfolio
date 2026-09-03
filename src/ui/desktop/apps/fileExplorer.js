import { iconFor, childrenOf, sortNodes } from "../vfs.js";

/**
 * Folder browser.
 *
 * Navigates in place with a breadcrumb rather than spawning a window per
 * folder — a few clicks into `projects/` should not leave five windows behind.
 * Non-folder nodes are handed to `openNode`, which decides which app opens.
 *
 * @param {import("../../../content.js").VfsNode} startNode
 * @param {string[]} startPath Names from the root down to startNode.
 * @param {(node: import("../../../content.js").VfsNode, path: string[]) => void} openNode
 */
export function fileExplorer(startNode, startPath, openNode) {
  const el = document.createElement("div");
  el.className = "app-explorer";

  /** Navigation history within this window. */
  let trail = [{ node: startNode, path: startPath }];

  function navigateTo(index) {
    trail = trail.slice(0, index + 1);
    render();
  }

  function render() {
    const current = trail[trail.length - 1];
    el.replaceChildren();

    // --- Breadcrumb ---
    const bar = document.createElement("nav");
    bar.className = "explorer-bar";

    const up = document.createElement("button");
    up.type = "button";
    up.className = "explorer-up";
    up.textContent = "↑";
    up.title = "Up one folder";
    up.disabled = trail.length <= 1;
    up.addEventListener("click", () => navigateTo(trail.length - 2));
    bar.append(up);

    trail.forEach((step, i) => {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.className = "explorer-sep";
        sep.textContent = "/";
        bar.append(sep);
      }
      const crumb = document.createElement("button");
      crumb.type = "button";
      crumb.className = "explorer-crumb";
      crumb.textContent = step.node.name;
      crumb.disabled = i === trail.length - 1;
      crumb.addEventListener("click", () => navigateTo(i));
      bar.append(crumb);
    });
    el.append(bar);

    // --- Contents ---
    const grid = document.createElement("div");
    grid.className = "explorer-grid";

    const items = sortNodes(childrenOf(current.node));
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "app-empty";
      empty.textContent = "This folder is empty.";
      grid.append(empty);
    }

    for (const node of items) {
      const path = [...current.path, node.name];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "explorer-item";
      btn.innerHTML = `<span class="explorer-icon"></span><span class="explorer-name"></span>`;
      btn.querySelector(".explorer-icon").textContent = iconFor(node);
      btn.querySelector(".explorer-name").textContent = node.name;
      btn.addEventListener("click", () => {
        if (node.type === "dir") {
          trail.push({ node, path });
          render();
          return;
        }
        openNode(node, path);
      });
      grid.append(btn);
    }

    el.append(grid);
  }

  render();
  return el;
}
