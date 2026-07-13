/**
 * ============================================================
 *  Smart Food Delivery Route Planner — Algorithm Comparator
 * ============================================================
 *  Module  : algorithms/comparator.js
 *  Purpose : Run all three TSP algorithms (Greedy, Held-Karp,
 *            MST 2-Approximation) on the same set of locations
 *            and return a unified comparison report.
 *
 *  The report includes:
 *    • Distance matrix
 *    • Individual results from each algorithm
 *    • Best algorithm  (shortest total distance)
 *    • Fastest algorithm (shortest execution time)
 *    • Estimated delivery time (city avg speed = 30 km/h)
 *    • Graceful handling when n > 20 (Held-Karp is skipped)
 *
 *  Exports : { compareAlgorithms }
 * ============================================================
 */

'use strict';

/* ───────────────────────── Dependencies ─────────────────────────── */

const { buildDistanceMatrix } = require('./distanceMatrix');
const { greedyTSP }           = require('./greedy');
const { heldKarpTSP }         = require('./dynamicProgramming');
const { approximationTSP }    = require('./approximation');

/* ───────────────────────── Constants ─────────────────────────────── */

/**
 * Average city driving speed in km/h, used to estimate delivery time.
 * Conservative value accounting for traffic, signals, and stops.
 * @constant {number}
 */
const AVG_CITY_SPEED_KMH = 30;

/**
 * Maximum node count for running the exact Held-Karp solver.
 * @constant {number}
 */
const HELD_KARP_LIMIT = 20;

/* ──────────────────────── Main Function ─────────────────────────── */

/**
 * Compare all three TSP algorithms on a common set of locations.
 *
 * @param {Array<{id: number|string, name: string, lat: number, lng: number}>} locations
 *   Array of delivery stops.  Index 0 is treated as the depot.
 *
 * @returns {{
 *   locations:        Array,
 *   distanceMatrix:   number[][],
 *   results:          Array<object>,
 *   bestAlgorithm:    string,
 *   fastestAlgorithm: string,
 *   summary:          object
 * }}
 *
 * @throws {Error} If locations is invalid.
 *
 * @example
 *   const locs = [
 *     { id: 1, name: 'Depot',      lat: 28.61, lng: 77.23 },
 *     { id: 2, name: 'Customer A', lat: 28.63, lng: 77.21 },
 *     { id: 3, name: 'Customer B', lat: 28.65, lng: 77.25 },
 *   ];
 *   const report = compareAlgorithms(locs);
 *   console.log(report.bestAlgorithm);
 */
function compareAlgorithms(locations) {
  // ── Validation ─────────────────────────────────────────────────── //
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error('compareAlgorithms() requires a non-empty array of locations.');
  }

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
      throw new Error(
        `Location at index ${i} is invalid — expected { id, name, lat: number, lng: number }.`
      );
    }
  }

  const n = locations.length;

  // ── Build distance matrix ─────────────────────────────────────── //
  const distMatrix = buildDistanceMatrix(locations);

  // ── Run algorithms ────────────────────────────────────────────── //
  const results = [];

  // 1. Greedy Nearest Neighbor ─────────────────────────────────── //
  try {
    const greedy = greedyTSP(distMatrix, 0);
    greedy.estimatedTimeMinutes = _estimateDeliveryTime(greedy.totalDistance);
    greedy.pathNames = _resolvePathNames(greedy.path, locations);
    results.push(greedy);
  } catch (err) {
    results.push({
      algorithm:     'Greedy Nearest Neighbor',
      complexity:    'O(n²)',
      error:         err.message,
      path:          [],
      totalDistance:  Infinity,
      executionTime: err.executionTime || 0,
    });
  }

  // 2. Held-Karp (Exact) ─────────────────────────────────────────── //
  if (n <= HELD_KARP_LIMIT) {
    try {
      const hk = heldKarpTSP(distMatrix);
      if (hk.error) {
        // The function returned gracefully with an error message
        results.push(hk);
      } else {
        hk.estimatedTimeMinutes = _estimateDeliveryTime(hk.totalDistance);
        hk.pathNames = _resolvePathNames(hk.path, locations);
        results.push(hk);
      }
    } catch (err) {
      results.push({
        algorithm:     'Held-Karp (Dynamic Programming)',
        complexity:    'O(n² × 2ⁿ)',
        error:         err.message,
        path:          [],
        totalDistance:  Infinity,
        executionTime: err.executionTime || 0,
      });
    }
  } else {
    // Skip Held-Karp — too many nodes
    results.push({
      algorithm:     'Held-Karp (Dynamic Programming)',
      complexity:    'O(n² × 2ⁿ)',
      path:          [],
      totalDistance:  Infinity,
      executionTime: 0,
      skipped:       true,
      error:         `Skipped: n=${n} exceeds the ${HELD_KARP_LIMIT}-node safety limit ` +
                     `for exact solutions. Held-Karp requires O(n·2ⁿ) memory.`,
    });
  }

  // 3. MST 2-Approximation ─────────────────────────────────────── //
  try {
    const approx = approximationTSP(distMatrix);
    approx.estimatedTimeMinutes = _estimateDeliveryTime(approx.totalDistance);
    approx.pathNames = _resolvePathNames(approx.path, locations);
    results.push(approx);
  } catch (err) {
    results.push({
      algorithm:          'MST 2-Approximation',
      complexity:         'O(n²)',
      approximationRatio: '≤ 2 × OPT',
      error:              err.message,
      path:               [],
      totalDistance:       Infinity,
      executionTime:      err.executionTime || 0,
    });
  }

  // ── Determine best & fastest ──────────────────────────────────── //
  const validResults = results.filter(
    (r) => !r.error && !r.skipped && r.totalDistance < Infinity
  );

  let bestAlgorithm    = 'N/A';
  let fastestAlgorithm = 'N/A';

  if (validResults.length > 0) {
    // Shortest distance
    const best = validResults.reduce((a, b) =>
      a.totalDistance <= b.totalDistance ? a : b
    );
    bestAlgorithm = best.algorithm;

    // Shortest execution time
    const fastest = validResults.reduce((a, b) =>
      a.executionTime <= b.executionTime ? a : b
    );
    fastestAlgorithm = fastest.algorithm;
  }

  // ── Build summary ─────────────────────────────────────────────── //
  const summary = _buildSummary(results, validResults, n);

  // ── Return full comparison report ─────────────────────────────── //
  return {
    locations,
    nodeCount:         n,
    distanceMatrix:    distMatrix,
    results,
    bestAlgorithm,
    fastestAlgorithm,
    summary,
  };
}

/* ──────────────────────── Internal Helpers ───────────────────────── */

/**
 * Estimate delivery time from total distance.
 *
 * @private
 * @param {number} distanceKm  Total route distance in km.
 * @returns {number} Estimated time in minutes (rounded to 1 dp).
 */
function _estimateDeliveryTime(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  const hours   = distanceKm / AVG_CITY_SPEED_KMH;
  const minutes = hours * 60;
  return Math.round(minutes * 10) / 10;        // 1 decimal place
}

/**
 * Map path indices to human-readable location names.
 *
 * @private
 * @param {number[]} path
 * @param {Array<{name: string}>} locations
 * @returns {string[]}
 */
function _resolvePathNames(path, locations) {
  return path.map((idx) => {
    const loc = locations[idx];
    return loc ? (loc.name || `Node-${idx}`) : `Unknown-${idx}`;
  });
}

/**
 * Build a human-readable summary object.
 *
 * @private
 * @param {object[]} allResults
 * @param {object[]} validResults
 * @param {number}   n
 * @returns {object}
 */
function _buildSummary(allResults, validResults, n) {
  const summary = {
    totalLocations:    n,
    algorithmsRun:     allResults.length,
    algorithmsSucceeded: validResults.length,
    avgCitySpeedKmh:   AVG_CITY_SPEED_KMH,
    heldKarpSkipped:   n > HELD_KARP_LIMIT,
    comparisons:       [],
  };

  // Per-algorithm one-liner
  for (const r of allResults) {
    if (r.error || r.skipped) {
      summary.comparisons.push({
        algorithm:     r.algorithm,
        status:        r.skipped ? 'skipped' : 'error',
        note:          r.error,
      });
    } else {
      summary.comparisons.push({
        algorithm:     r.algorithm,
        distance:      `${r.totalDistance.toFixed(2)} km`,
        time:          `${r.executionTime.toFixed(4)} ms`,
        estimatedETA:  `${r.estimatedTimeMinutes} min`,
      });
    }
  }

  // Distance improvement: how much better is the best vs the worst valid
  if (validResults.length >= 2) {
    const distances = validResults.map((r) => r.totalDistance);
    const minD = Math.min(...distances);
    const maxD = Math.max(...distances);
    if (maxD > 0) {
      summary.distanceSpreadPercent =
        Math.round(((maxD - minD) / maxD) * 10000) / 100;
    }
  }

  return summary;
}

/* ═══════════════════════════ Module Export ════════════════════════════ */

module.exports = { compareAlgorithms };
