/**
 * ============================================================
 *  Smart Food Delivery Route Planner — Held-Karp (Exact TSP)
 * ============================================================
 *  Module  : algorithms/heldKarp.js
 *  Purpose : Solve TSP *exactly* with the Held-Karp dynamic
 *            programming algorithm (bitmask DP).
 *
 *  Algorithm overview:
 *    dp[S][i] = minimum cost to start at node 0, visit every node
 *               in subset S, and end at node i  (i ∈ S).
 *
 *    Base cases  :  dp[{0,j}][j] = dist(0, j)   for j ≠ 0
 *    Transition  :  dp[S][j]     = min over k∈S\{j} of
 *                                  dp[S\{j}][k] + dist(k, j)
 *    Answer      :  min over j≠0 of dp[FULL][j] + dist(j, 0)
 *
 *  Time complexity  : O(n² · 2ⁿ)
 *  Space complexity : O(n  · 2ⁿ)
 *
 *  ⚠️  For n > 20 the memory / time requirements explode, so
 *     the function refuses and returns an error object.
 *
 *  Exports : { heldKarpTSP }
 * ============================================================
 */

'use strict';

/* ────────────────────── Safety Constants ─────────────────────────── */

/**
 * Maximum number of nodes the algorithm will attempt.
 * 20 nodes → 2²⁰ = 1 048 576 subsets × 20 ≈ 20 M dp entries.
 * @constant {number}
 */
const MAX_NODES = 20;

/* ──────────────────────── Main Algorithm ─────────────────────────── */

/**
 * Solve TSP exactly using the Held-Karp bitmask DP approach.
 *
 * @param {number[][]} distMatrix
 *   Symmetric n×n distance matrix (km).  Node 0 is the depot.
 *
 * @returns {{
 *   path:          number[],
 *   totalDistance:  number,
 *   executionTime: number,
 *   algorithm:     string,
 *   complexity:    string,
 *   error?:        string
 * }}
 *
 * @throws {Error} On invalid input.
 *
 * @example
 *   const dm = [
 *     [0, 10, 15, 20],
 *     [10, 0, 35, 25],
 *     [15, 35,  0, 30],
 *     [20, 25, 30,  0],
 *   ];
 *   const result = heldKarpTSP(dm);
 *   console.log(result.path);          // Optimal tour
 *   console.log(result.totalDistance);  // Optimal distance
 */
function heldKarpTSP(distMatrix) {
  const t0 = process.hrtime.bigint();

  try {
    // ── Validation ─────────────────────────────────────────────────── //
    _validateMatrix(distMatrix);
    const n = distMatrix.length;

    // ── Safety cap ──────────────────────────────────────────────────── //
    if (n > MAX_NODES) {
      return {
        path:          [],
        totalDistance:  Infinity,
        executionTime: _elapsed(t0),
        algorithm:     'Held-Karp (Dynamic Programming)',
        complexity:    'O(n² × 2ⁿ)',
        error:         `Input size n=${n} exceeds the safety limit of ${MAX_NODES} nodes. ` +
                       `Held-Karp requires O(n·2ⁿ) memory and would be impractical.`,
      };
    }

    // ── Edge case: single node ──────────────────────────────────────── //
    if (n === 1) {
      return _buildResult([0, 0], 0, t0);
    }

    // ── Edge case: two nodes ────────────────────────────────────────── //
    if (n === 2) {
      const d = distMatrix[0][1] + distMatrix[1][0];
      return _buildResult([0, 1, 0], d, t0);
    }

    // ──────────────────────────────────────────────────────────────── //
    //  Bitmask DP
    //  We use bitmask `S` where bit j is set ⟺ node j is in the
    //  visited subset.  Node 0 is always the start / depot.
    // ──────────────────────────────────────────────────────────────── //

    const FULL = (1 << n) - 1;                    // all bits set

    // dp[mask][i]     = min cost to visit subset `mask` ending at i
    // parent[mask][i] = predecessor node on the optimal sub-tour
    const dp     = Array.from({ length: 1 << n }, () => new Array(n).fill(Infinity));
    const parent = Array.from({ length: 1 << n }, () => new Array(n).fill(-1));

    // ── Base cases: go directly from depot (0) to each other node ──── //
    for (let j = 1; j < n; j++) {
      const mask = (1 << 0) | (1 << j);           // {0, j}
      dp[mask][j]     = distMatrix[0][j];
      parent[mask][j] = 0;
    }

    // ── Fill DP table for larger subsets ─────────────────────────────── //
    for (let mask = 1; mask <= FULL; mask++) {
      // Subset must include the depot (bit 0)
      if (!(mask & 1)) continue;

      for (let j = 1; j < n; j++) {
        // j must be in the subset
        if (!(mask & (1 << j))) continue;
        // Skip if dp[mask][j] hasn't been reached yet
        if (dp[mask][j] === Infinity) continue;

        // Try extending to every node k not yet in the subset
        for (let k = 1; k < n; k++) {
          if (mask & (1 << k)) continue;           // k already visited

          const newMask = mask | (1 << k);
          const newCost = dp[mask][j] + distMatrix[j][k];

          if (newCost < dp[newMask][k]) {
            dp[newMask][k]     = newCost;
            parent[newMask][k] = j;
          }
        }
      }
    }

    // ── Find optimal last node before returning to depot ─────────── //
    let bestCost = Infinity;
    let lastNode = -1;

    for (let j = 1; j < n; j++) {
      const cost = dp[FULL][j] + distMatrix[j][0];
      if (cost < bestCost) {
        bestCost = cost;
        lastNode = j;
      }
    }

    // ── Reconstruct path ──────────────────────────────────────────── //
    const path = _reconstructPath(parent, FULL, lastNode, n);

    return _buildResult(path, bestCost, t0);

  } catch (err) {
    const elapsed = _elapsed(t0);
    throw Object.assign(err, { executionTime: elapsed });
  }
}

/* ──────────────────────── Path Reconstruction ───────────────────── */

/**
 * Walk the parent pointers backwards to recover the optimal tour.
 *
 * @private
 * @param {number[][]} parent   parent[mask][i] = predecessor.
 * @param {number}     mask     Current bitmask (starts at FULL).
 * @param {number}     lastNode Last node before depot.
 * @param {number}     n        Number of nodes.
 * @returns {number[]} Tour starting and ending at node 0.
 */
function _reconstructPath(parent, mask, lastNode, n) {
  const path = [];
  let current = lastNode;

  // Walk backwards through the parent pointers
  while (current !== -1 && current !== 0) {
    path.push(current);
    const prev = parent[mask][current];
    mask = mask ^ (1 << current);                 // remove current from subset
    current = prev;
  }

  path.push(0);          // prepend depot
  path.reverse();         // path is now start → … → lastNode
  path.push(0);           // append depot (return trip)

  return path;
}

/* ──────────────────────── Internal Helpers ───────────────────────── */

/**
 * Validate that dm is a well-formed square matrix.
 * @private
 * @param {number[][]} dm
 */
function _validateMatrix(dm) {
  if (!Array.isArray(dm) || dm.length === 0) {
    throw new Error('distMatrix must be a non-empty 2-D array.');
  }
  const n = dm.length;
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(dm[i]) || dm[i].length !== n) {
      throw new Error(`distMatrix row ${i} is malformed — expected ${n} columns.`);
    }
  }
}

/**
 * Elapsed ms from a bigint hrtime start value.
 * @private
 * @param {bigint} t0
 * @returns {number}
 */
function _elapsed(t0) {
  return Number(process.hrtime.bigint() - t0) / 1_000_000;
}

/**
 * Build standardised result object.
 * @private
 * @param {number[]} path
 * @param {number}   totalDistance
 * @param {bigint}   t0
 * @returns {object}
 */
function _buildResult(path, totalDistance, t0) {
  return {
    path,
    totalDistance:  Math.round(totalDistance * 10000) / 10000,
    executionTime: Math.round(_elapsed(t0) * 10000) / 10000,
    algorithm:     'Held-Karp (Dynamic Programming)',
    complexity:    'O(n² × 2ⁿ)',
  };
}

/* ═══════════════════════════ Module Export ════════════════════════════ */

module.exports = { heldKarpTSP };
