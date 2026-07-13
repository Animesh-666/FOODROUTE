/**
 * ============================================================
 *  Smart Food Delivery Route Planner — Greedy Nearest Neighbor
 * ============================================================
 *  Module  : algorithms/greedy.js
 *  Purpose : Solve the Travelling Salesman Problem (TSP) with the
 *            classic Greedy Nearest Neighbor heuristic.
 *
 *  Algorithm overview:
 *    1. Start at the depot node (default index 0).
 *    2. Mark the current node as visited.
 *    3. Move to the nearest unvisited node.
 *    4. Repeat until all nodes are visited.
 *    5. Return to the depot.
 *
 *  Time complexity  : O(n²)  — n iterations, each scanning n nodes.
 *  Space complexity : O(n)   — visited set + path array.
 *
 *  This heuristic does NOT guarantee an optimal tour, but is fast
 *  and produces a reasonable baseline for comparison.
 *
 *  Exports : { greedyTSP }
 * ============================================================
 */

'use strict';

/* ──────────────────────── Main Algorithm ─────────────────────────── */

/**
 * Solve TSP using the Greedy Nearest Neighbor heuristic.
 *
 * @param {number[][]} distMatrix
 *   Symmetric n×n distance matrix where distMatrix[i][j] is the
 *   distance (km) between node i and node j.
 * @param {number} [startNode=0]
 *   Index of the depot / starting node.
 *
 * @returns {{
 *   path:          number[],
 *   totalDistance:  number,
 *   executionTime: number,
 *   algorithm:     string,
 *   complexity:    string
 * }}
 *   - path          — Ordered list of node indices (starts & ends at startNode).
 *   - totalDistance  — Total tour distance in km.
 *   - executionTime — Wall-clock time in milliseconds.
 *   - algorithm     — Human-readable algorithm name.
 *   - complexity    — Big-O notation.
 *
 * @throws {Error} If distMatrix is invalid or startNode is out of range.
 *
 * @example
 *   const dm = [
 *     [0, 10, 15, 20],
 *     [10, 0, 35, 25],
 *     [15, 35,  0, 30],
 *     [20, 25, 30,  0],
 *   ];
 *   const result = greedyTSP(dm);
 *   console.log(result.path);          // e.g. [0, 1, 3, 2, 0]
 *   console.log(result.totalDistance);  // e.g. 80
 */
function greedyTSP(distMatrix, startNode = 0) {
  // ── Start high-resolution timer ────────────────────────────────── //
  const t0 = process.hrtime.bigint();

  try {
    // ── Validation ─────────────────────────────────────────────────── //
    _validateMatrix(distMatrix);
    const n = distMatrix.length;

    if (startNode < 0 || startNode >= n) {
      throw new Error(`startNode (${startNode}) is out of range [0, ${n - 1}].`);
    }

    // ── Edge case: single node ──────────────────────────────────────── //
    if (n === 1) {
      return _buildResult([startNode, startNode], 0, t0);
    }

    // ── Edge case: two nodes ────────────────────────────────────────── //
    if (n === 2) {
      const other = startNode === 0 ? 1 : 0;
      const dist  = distMatrix[startNode][other] + distMatrix[other][startNode];
      return _buildResult([startNode, other, startNode], dist, t0);
    }

    // ── Greedy loop ─────────────────────────────────────────────────── //
    const visited = new Array(n).fill(false);
    const path    = [startNode];
    visited[startNode] = true;

    let current       = startNode;
    let totalDistance  = 0;
    let visitedCount  = 1;

    while (visitedCount < n) {
      let nearestNode = -1;
      let nearestDist = Infinity;

      // Scan all unvisited nodes for the nearest one
      for (let j = 0; j < n; j++) {
        if (!visited[j] && distMatrix[current][j] < nearestDist) {
          nearestDist = distMatrix[current][j];
          nearestNode = j;
        }
      }

      // Safety: if no reachable unvisited node was found
      if (nearestNode === -1) {
        throw new Error(
          'Greedy TSP: unable to find a reachable unvisited node. ' +
          'Check that the distance matrix contains finite values.'
        );
      }

      // Move to the nearest node
      visited[nearestNode] = true;
      totalDistance += nearestDist;
      path.push(nearestNode);
      current = nearestNode;
      visitedCount++;
    }

    // ── Return to depot ─────────────────────────────────────────────── //
    totalDistance += distMatrix[current][startNode];
    path.push(startNode);

    return _buildResult(path, totalDistance, t0);

  } catch (err) {
    // Capture time even on error so callers can log it
    const elapsed = _elapsed(t0);
    throw Object.assign(err, { executionTime: elapsed });
  }
}

/* ──────────────────────── Internal Helpers ───────────────────────── */

/**
 * Validate that distMatrix is a well-formed square matrix.
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
 * Compute elapsed time from a bigint hrtime start value.
 * @private
 * @param {bigint} t0  Value from process.hrtime.bigint().
 * @returns {number} Elapsed milliseconds (4 decimal places).
 */
function _elapsed(t0) {
  const diff = process.hrtime.bigint() - t0;
  // Convert nanoseconds → milliseconds
  return Number(diff) / 1_000_000;
}

/**
 * Build the standardised result object.
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
    algorithm:     'Greedy Nearest Neighbor',
    complexity:    'O(n²)',
  };
}

/* ═══════════════════════════ Module Export ════════════════════════════ */

module.exports = { greedyTSP };
