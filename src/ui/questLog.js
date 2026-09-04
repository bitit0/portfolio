/**
 * Top-right quest / objectives HUD. DOM, non-interactive (pointer-events: none).
 * Mark a quest done by adding `is-done` to its item — see complete() below.
 */

/** @type {{ id: string, label: string }[]} */
const QUESTS = [{ id: "explore", label: "Explore!" }];

export function mountQuestLog() {
  const el = document.createElement("aside");
  el.id = "questlog";
  el.setAttribute("aria-label", "Quests");

  const items = QUESTS.map(
    (q) =>
      `<li class="quest-item" data-quest="${q.id}">
        <span class="quest-check" aria-hidden="true"></span>
        <span class="quest-label">${q.label}</span>
      </li>`,
  ).join("");

  el.innerHTML = `<h2 class="quest-title">Quests</h2><ul class="quest-list">${items}</ul>`;
  document.body.append(el);

  return {
    /** Marks a quest complete (crosses it off). */
    complete(id) {
      el.querySelector(`.quest-item[data-quest="${id}"]`)?.classList.add("is-done");
    },
  };
}
