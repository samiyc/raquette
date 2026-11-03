import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";
import { localTimestamp } from "../../src/replay-log.js";

/**
 * The replays on disk (out of git, as in lopin and the other projects): a series of rallies is a gzipped JSON Lines file in
 * replays/series/, its first line what played it, then one line per rally. What the code was, down to a file changed since the
 * last commit, goes in that first line. A file of a series is read back by `readSeries`.
 */
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const SERIES_FOLDER = path.join(ROOT, "replays", "series");

function git(...args) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- a script of this machine, reading its own commit.
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

/** Every file of src/, hashed: what really ran, even when the working tree differs from its commit. */
function codeHash() {
  const hash = createHash("sha256");
  const walk = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(full);
      else hash.update(entry.name).update(readFileSync(full));
    }
  };
  walk(path.join(ROOT, "src"));
  return hash.digest("hex").slice(0, 16);
}

/** What the code is now. */
export function codeOf() {
  return { commit: git("rev-parse", "--short", "HEAD"), dirty: git("status", "--porcelain", "--", "src").length > 0, src: codeHash(), node: process.version };
}

/** `2026-11-03_21-47-39_R3-vs-R0_100000-1200.jsonl.gz` */
function seriesName({ a, b, from, seeds }) {
  const when = localTimestamp().slice(0, 19).replace("T", "_").replaceAll(":", "-");
  return `${when}_${a}-vs-${b}_${from}-${seeds}.jsonl.gz`;
}

/** Writes a series. @returns {string} its path */
export function writeSeries(naming, header, rallies) {
  mkdirSync(SERIES_FOLDER, { recursive: true });
  const file = path.join(SERIES_FOLDER, seriesName(naming));
  const lines = [JSON.stringify(header), ...rallies.map((rally) => JSON.stringify(rally))];
  writeFileSync(file, gzipSync(`${lines.join("\n")}\n`));
  return file;
}

/** A series back from disk. @returns {{header: any, rallies: any[]}} */
export function readSeries(file) {
  const [first, ...rest] = gunzipSync(readFileSync(file)).toString("utf8").trim().split("\n");
  return { header: JSON.parse(first), rallies: rest.map((line) => JSON.parse(line)) };
}
