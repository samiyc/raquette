import { Worker } from "node:worker_threads";

/**
 * Threads that stay up for many duels of a tunable rule (scripts/rule-worker.js): CMA-ES scores a population of plans each generation,
 * dozens of short duels, and playOnThreads starts its threads anew for each one. Seeds go by batches, put back in order: the scores do
 * not depend on the threads.
 */
const BATCH = 10;
const WORKER = new URL("../rule-worker.js", import.meta.url);

/**
 * @param {number} threads
 * @param {Record<string, any>} [catalog] numbers for opponents named outside src/rules/tuned.js
 */
export function createRulePool(threads, catalog = {}) {
  const workers = Array.from({ length: Math.max(1, threads) }, () => new Worker(WORKER, { workerData: { catalog } }));
  /**
   * Each request's points seed by seed (0 to 2 a seed, both serving once), in the order of the requests.
   * @param {{numbers: Record<string, number>, against: string, from: number, seeds: number, serving?: string}[]} requests
   * @returns {Promise<number[][]>}
   */
  function play(requests) {
    const tasks = requests.flatMap((request, at) => Array.from({ length: Math.ceil(request.seeds / BATCH) }, (_, k) => ({ at, k, from: request.from + k * BATCH, seeds: Math.min(BATCH, request.seeds - k * BATCH) })));
    const results = requests.map((request) => new Array(Math.ceil(request.seeds / BATCH)));
    let next = 0;
    let done = 0;
    if (tasks.length === 0) return Promise.resolve(requests.map(() => []));
    return new Promise((resolve, reject) => {
      const hand = (worker) => {
        if (next >= tasks.length) return;
        const { at, from, seeds } = tasks[next];
        const { numbers, against, serving } = requests[at];
        worker.postMessage({ task: next, numbers, against, from, seeds, serving });
        next += 1;
      };
      for (const worker of workers) {
        worker.removeAllListeners("message");
        worker.removeAllListeners("error");
        worker.on("message", ({ task, scoresA }) => {
          results[tasks[task].at][tasks[task].k] = scoresA;
          done += 1;
          if (done === tasks.length) resolve(results.map((parts) => parts.flat()));
          else hand(worker);
        });
        worker.on("error", reject);
        hand(worker);
      }
    });
  }
  return { play, close: () => Promise.all(workers.map((worker) => worker.terminate())) };
}
