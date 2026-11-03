import { decideOn } from "../src/remote.js";
import { namedRule } from "../src/rules/named.js";

/** The search of the page, on a thread of its own: the page goes on drawing and listening while it thinks. */
const rules = new Map();

function ruleOf(name, budget) {
  const key = `${name}@${budget}`;
  if (!rules.has(key)) rules.set(key, namedRule(name, budget));
  return rules.get(key);
}

globalThis.onmessage = ({ data: { picture, who, robot, budget } }) => {
  globalThis.postMessage({ tick: picture.tick, intent: decideOn(picture, who, ruleOf(robot, budget)) });
};
