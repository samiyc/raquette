import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The measures of J6, as jobs of the queue (mcts-commun/docs/backlog.md): a job per pair, of 3 or 6 threads, on seeds that served
 * no setting. `node scripts/queue-j6.js add` adds them, `node scripts/queue-j6.js read` prints what they gave. Each run of `add`
 * takes a fresh tag: an id is never used twice.
 */
const BACKLOG = fileURLToPath(new URL("../../mcts-commun/bin/backlog.js", import.meta.url));
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const TAGS = fileURLToPath(new URL("../tmp/queue-j6.json", import.meta.url));
const FROM = 700000;

/** A, B, seeds, threads, estimate in minutes, and options. */
const JOBS = [
  ["S", "R3", 1200, 6, 8, "--replays"],
  ["S", "R0", 1200, 6, 8],
  ["MC", "R3", 1200, 6, 8],
  ["S", "MC", 600, 6, 8],
  ["S", "Sfull", 600, 6, 8],
  ["MC", "MCfull", 600, 6, 8],
  ["S4", "S", 300, 6, 8],
  ["R1", "R0", 1200, 3, 4],
  ["R3", "R0", 1200, 3, 4],
  ["R3", "R2", 1200, 3, 4],
  ["R4", "R3", 1200, 3, 4],
  ["R5", "R4", 1200, 3, 4],
];

// eslint-disable-next-line sonarjs/no-os-command-from-path -- a script of this machine, calling the queue's own command.
const backlog = (...args) => execFileSync("node", [BACKLOG, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

function add() {
  const tag = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const ids = JOBS.map(([a, b, seeds, threads, minutes, ...extra]) => {
    const id = `raquette-j6-${a}-${b}-${tag}`;
    const command = ["node", "scripts/duel.js", a, b, "--seeds", String(seeds), "--from", String(FROM), ...extra];
    backlog("--add", id, "--cwd", ROOT, "--threads", String(threads), "--min-threads", String(Math.ceil(Number(threads) / 2)), "--estimate", `${minutes} min`, "--limit", "45", "--", ...command);
    return id;
  });
  writeFileSync(TAGS, JSON.stringify(ids));
  console.log(ids.join("\n"));
}

function readJob(id) {
  const status = JSON.parse(backlog("--status", id, "--json")) ?? {};
  console.log(`[${status.status ?? "inconnu"}, ${status.minutes ?? "?"} min] ${id}`);
  if (status.output && existsSync(status.output)) console.log(readFileSync(status.output, "utf8").trim());
}

function read() {
  if (existsSync(TAGS)) JSON.parse(readFileSync(TAGS, "utf8")).forEach(readJob);
}

if (process.argv[2] === "add") add();
else read();
