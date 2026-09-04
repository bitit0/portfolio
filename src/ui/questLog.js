/**
 * Top-right quest / objectives HUD. DOM, non-interactive (pointer-events: none).
 * Mark a quest done by adding `is-done` to its item — see complete() below.
 */

/** @type {{ id: string, label: string }[]} */
const QUESTS = [{ id: "explore", label: "Explore!" }];

/** @type {HTMLElement | null} */
let root = null;

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
  root = el;
}

/** Updates a quest's `(current/total)` counter, and marks it done (X in the box,
 *  label struck through) once current reaches total. No-op if unmounted. */
export function setQuestProgress(id, current, total) {
  const item = root?.querySelector(`.quest-item[data-quest="${id}"]`);
  if (!item) return;
  const quest = QUESTS.find((q) => q.id === id);
  const label = item.querySelector(".quest-label");
  if (label && quest) label.textContent = `${quest.label} (${current}/${total})`;
  item.classList.toggle("is-done", current >= total);
}
