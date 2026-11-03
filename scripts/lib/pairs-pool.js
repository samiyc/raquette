import { Worker } from "node:worker_threads";
import { progress } from "mcts-commun/trace.js";
import { mergePairs } from "../../src/pairs.js";

/**
 * Two rules by pairs on several threads: `MCTS_THREADS` workers take seeds by small batches (mcts-commun/docs/backlog.md,
 * recommendations 1 and 5). A seed gives the same rallies whichever worker plays it, and the batches are put back in order, so
 * that the result does not depend on the threads.
 */
const BATCH = 10;
const WORKER = new URL("../duel-worker.js", import.meta.url);

/** The batches of seeds, in order. */
export function batchesOf(from, seeds, size = BATCH) {
  const batches = [];
  for (let start = 0; start < seeds; start += size) batches.push({ index: batches.length, from: from + start, seeds: Math.min(size, seeds - start) });
  return batches;
}

/**
 * @param {{names: string[], budget: number, from: number, seeds: number, replays: boolean, serving?: string}} match
 * @param {number} threads
 * @returns {Promise<{report: any, lines: any[]}>}
 */
export function playOnThreads(match, threads) {
  const batches = batchesOf(match.from, match.seeds);
  const parts = new Array(batches.length);
  let next = 0;
  let done = 0;
  return new Promise((resolve, reject) => {
    const hand = (worker) => {
      if (next < batches.length) {
        worker.postMessage(batches[next]);
        next += 1;
      } else worker.terminate();
    };
    const onPart = (worker, { index, part }) => {
      parts[index] = part;
      done += part.scoresA.length;
      progress("duel", done, match.seeds, { unit: "graine" });
      hand(worker);
      if (parts.filter(Boolean).length === batches.length) resolve({ report: mergePairs(parts), lines: parts.flatMap((one) => one.lines) });
    };
    for (let i = 0; i < Math.max(1, threads); i += 1) {
      const worker = new Worker(WORKER, { workerData: match });
      worker.on("message", (message) => onPart(worker, message));
      worker.on("error", reject);
      hand(worker);
    }
  });
}
