/**
 * A small quest / objectives tracker in the top-right corner.
 *
 * DOM HUD rather than canvas, like the other overlays — it stays sharp at any
 * camera zoom and is non-interactive (pointer-events: none), so it never eats a
 * click meant for the room. Objectives are marked done by adding `is-done` to
 * the matching item, so wiring one up to real progress later is a one-liner.
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
