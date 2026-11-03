import { CLUB_PLAYER } from "../src/player.js";
import { decideOn } from "../src/remote.js";
import { namedRule } from "../src/rules/named.js";

/** The search of the page, on a thread of its own: the page goes on drawing and listening while it thinks. */
const rules = new Map();

function ruleOf(name, budget) {
  const key = `${name}@${budget}`;
  if (!rules.has(key)) rules.set(key, namedRule(name, budget));
  return rules.get(key);
}

/** A decision for a rally under way, or the service of a point to come. */
globalThis.onmessage = ({ data: { picture, who, robot, budget, service } }) => {
  const rule = ruleOf(robot, budget);
  if (service) {
    const picked = rule.chooseService?.({ seed: service.seed, server: service.server, profile: CLUB_PLAYER });
    globalThis.postMessage({ service: picked ? { key: picked.key, y: picked.y } : null, seed: service.seed });
    return;
  }
  globalThis.postMessage({ tick: picture.tick, intent: decideOn(picture, who, rule) });
};
