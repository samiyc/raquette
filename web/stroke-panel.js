import { STROKE_KINDS } from "../src/strokes.js";

/** The buttons of the strokes: what is drawn from what src/strokes.js says, and nothing decided here. */

/** @param {HTMLElement} box @param {(key: string) => void} onPick */
export function buildStrokes(box, onPick) {
  Object.entries(STROKE_KINDS).forEach(([key, { label }], i) => {
    const button = document.createElement("button");
    Object.assign(button, { type: "button", className: "quiet", textContent: `${i + 1}. ${label}` });
    button.dataset.stroke = key;
    button.addEventListener("click", () => onPick(key));
    box.append(button);
  });
}

/** @param {HTMLElement} box @param {Record<string, string | null>} choices @param {string} current */
export function showStrokes(box, choices, current) {
  for (const button of box.querySelectorAll("button")) {
    const why = choices[button.dataset.stroke];
    button.disabled = why !== null;
    button.title = why ?? "";
    button.setAttribute("aria-pressed", String(current === button.dataset.stroke));
  }
}
