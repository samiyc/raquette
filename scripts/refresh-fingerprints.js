import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Writes the new hashes into tests/fingerprint.test.js, for a change meant to alter the model: its commit says so, with the measures
 * before and after. It prints what moved, and never touches a hash the test does not complain about.
 */
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const FILE = new URL("../tests/fingerprint.test.js", import.meta.url);

const { stdout, stderr } = spawnSync(process.execPath, ["--test", "tests/fingerprint.test.js"], { cwd: ROOT, encoding: "utf8" });
const moved = [...`${stdout}${stderr}`.matchAll(/\+ '([0-9a-f]{16})'\s+- '([0-9a-f]{16})'/g)];
let text = readFileSync(FILE, "utf8");
const seen = new Set();
for (const [, now, before] of moved) {
  if (seen.has(before)) continue;
  seen.add(before);
  text = text.replace(before, now);
  console.log(`${before} → ${now}`);
}
writeFileSync(FILE, text);
if (moved.length === 0) console.log("Aucune empreinte ne bouge.");
