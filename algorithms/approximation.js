/**
 * ============================================================
 *  Smart Food Delivery Route Planner — MST 2-Approximation TSP
 * ============================================================
 *  Module  : algorithms/approximation.js
 *  Purpose : Solve TSP with the classic MST-based 2-approximation.
 *
 *  Algorithm overview:
 *    1. Build a Minimum Spanning Tree (Prim's algorithm).
 *    2. Perform a DFS preorder traversal on the MST.
 *    3. Use the preorder sequence as a Hamiltonian cycle
 *       ("shortcut" repeated visits).
 *    4. Append the start node to close the tour.
 *
 *  Guarantee : tour length  ≤  2 × OPT   (for metric TSP,
 *              i.e. when the triangle inequality holds — which
 *              it does for Haversine distances).
 *
 *  Time complexity  : O(n²)  — dominated by Prim's algorithm.
 *  Space complexity : O(n²)  — MST adjacency list.
 *
 *  Exports : { approximationTSP }
 * ============================================================
 */

'use strict';

/* ──────────────────────── Main Algorithm ─────────────────────────── */

/**
 * Solve TSP using the MST-based 2-approximation heuristic.
 *
 * @param {number[][]} distMatrix
 *   Symmetric n×n distance matrix (km).  Node 0 is the depot.
 *
 * @returns {{
 *   path:               number[],
 *   totalDistance:       number,
 *   executionTime:      number,
 *   algorithm:          string,
 *   complexity:         string,
 *   approximationRatio: string,
 *   mstWeight:          number
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
 *   const result = approximationTSP(dm);
 *   console.log(result.path);
 *   console.log(result.totalDistance);
 */
function approximationTSP(distMatrix) {
  const t0 = process.hrtime.bigint();

  try {
    // ── Validation ─────────────────────────────────────────────────── //
    _validateMatrix(distMatrix);
    const n = distMatrix.length;

    // ── Edge case: single node ──────────────────────────────────────── //
    if (n === 1) {
      return _buildResult([0, 0], 0, 0, t0);
    }

    // ── Edge case: two nodes ────────────────────────────────────────── //
    if (n === 2) {
      const d   = distMatrix[0][1] + distMatrix[1][0];
      const mst = distMatrix[0][1];
      return _buildResult([0, 1, 0], d, mst, t0);
    }

    // ── Step 1: Build MST using Prim's algorithm ────────────────────── //
    const { mstAdj, mstWeight } = _primMST(distMatrix, n);

    // ── Step 2: DFS preorder traversal of the MST ───────────────────── //
    const preorder = _dfsPreorder(mstAdj, n, 0);

    // ── Step 3: Shortcut — the preorder IS the Hamiltonian path ─────── //
    //    Close the cycle by returning to the start.
    const path = [...preorder, preorder[0]];

    // ── Calculate total tour distance ───────────────────────────────── //
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += distMatrix[path[i]][path[i + 1]];
    }

    return _buildResult(path, totalDistance, mstWeight, t0);

  } catch (err) {
    const elapsed = _elapsed(t0);
    throw Object.assign(err, { executionTime: elapsed });
  }
}

/* ──────────────────── Prim's MST Algorithm ──────────────────────── */

/**
 * Build a Minimum Spanning Tree using Prim's algorithm (simple
 * O(n²) version with a key array — optimal for dense graphs
 * represented as adjacency matrices).
 *
 * @private
 * @param {number[][]} dist  Distance matrix.
 * @param {number}     n     Number of nodes.
 * @returns {{ mstAdj: Map<number, number[]>, mstWeight: number }}
 *   mstAdj   — Adjacency list of the MST (undirected).
 *   mstWeight — Total weight of the MST.
 */
function _primMST(dist, n) {
  const inMST  = new Array(n).fill(false);     // Is node in MST?
  const key    = new Array(n).fill(Infinity);   // Cheapest edge to MST
  const parent = new Array(n).fill(-1);         // Parent in MST

  // Start from node 0
  key[0] = 0;

  for (let count = 0; count < n; count++) {
    // ── Pick the cheapest node NOT yet in the MST ───────────────── //
    let u = -1;
    let minKey = Infinity;
    for (let v = 0; v < n; v++) {
      if (!inMST[v] && key[v] < minKey) {
        minKey = key[v];
        u = v;
      }
    }

    if (u === -1) {
      throw new Error('MST construction failed — graph may be disconnected.');
    }

    inMST[u] = true;

    // ── Update keys of neighbours ──────────────────────────────── //
    for (let v = 0; v < n; v++) {
      if (!inMST[v] && dist[u][v] < key[v]) {
        key[v]    = dist[u][v];
        parent[v] = u;
      }
    }
  }

  // ── Build adjacency list from parent array ──────────────────── //
  const mstAdj = new Map();
  for (let i = 0; i < n; i++) {
    mstAdj.set(i, []);
  }

  let mstWeight = 0;
  for (let v = 1; v < n; v++) {
    const u = parent[v];
    mstAdj.get(u).push(v);
    mstAdj.get(v).push(u);
    mstWeight += dist[u][v];
  }

  return { mstAdj, mstWeight };
}

/* ──────────────────── DFS Preorder Traversal ────────────────────── */

/**
 * Iterative DFS preorder traversal of the MST.
 *
 * Using an iterative approach (explicit stack) to avoid call-stack
 * overflow on large inputs.  Children are pushed in reverse order
 * so they are visited left-to-right.
 *
 * @private
 * @param {Map<number, number[]>} adj   MST adjacency list.
 * @param {number}                n     Number of nodes.
 * @param {number}                start Root node.
 * @returns {number[]} Preorder node sequence.
 */
function _dfsPreorder(adj, n, start) {
  const visited  = new Array(n).fill(false);
  const preorder = [];
  const stack    = [start];

  while (stack.length > 0) {
    const node = stack.pop();

    if (visited[node]) continue;
    visited[node] = true;
    preorder.push(node);

    // Push neighbours in reverse so the first neighbour is visited first
    const neighbors = adj.get(node) || [];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      if (!visited[neighbors[i]]) {
        stack.push(neighbors[i]);
      }
    }
  }

  return preorder;
}

/* ──────────────────────── Internal Helpers ───────────────────────── */

/**
 * Validate square distance matrix.
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
 * Elapsed ms from bigint hrtime.
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
 * @param {number}   mstWeight
 * @param {bigint}   t0
 * @returns {object}
 */
function _buildResult(path, totalDistance, mstWeight, t0) {
  return {
    path,
    totalDistance:       Math.round(totalDistance * 10000) / 10000,
    executionTime:      Math.round(_elapsed(t0) * 10000) / 10000,
    algorithm:          'MST 2-Approximation',
    complexity:         'O(n²)',
    approximationRatio: '≤ 2 × OPT',
    mstWeight:          Math.round(mstWeight * 10000) / 10000,
  };
}

/* ═══════════════════════════ Module Export ════════════════════════════ */

module.exports = { approximationTSP };
