/**
 * ============================================================
 *  Smart Food Delivery Route Planner — Distance Matrix Builder
 * ============================================================
 *  Module  : algorithms/distanceMatrix.js
 *  Purpose : Compute great-circle ("as-the-crow-flies") distances
 *            between GPS coordinates using the Haversine formula,
 *            and build a full n×n symmetric distance matrix.
 *  Exports : { haversineDistance, buildDistanceMatrix, toRadians }
 * ============================================================
 */

'use strict';

/* ───────────────────────── Constants ─────────────────────────────── */

/**
 * Mean radius of the Earth in kilometres.
 * Used by the Haversine formula.
 * @constant {number}
 */
const EARTH_RADIUS_KM = 6371;

/* ───────────────────────── Helpers ───────────────────────────────── */

/**
 * Convert degrees to radians.
 *
 * @param {number} degrees  Angle in degrees.
 * @returns {number} Angle in radians.
 *
 * @example
 *   toRadians(180); // → Math.PI  (≈ 3.14159)
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/* ──────────────────── Haversine Distance ─────────────────────────── */

/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula.
 *
 * The Haversine formula is one of the most common ways to compute
 * distances from GPS coordinates.  It assumes a perfect sphere,
 * which introduces ≤ 0.3 % error for city-scale distances — well
 * within acceptable limits for a food-delivery planner.
 *
 * Formula:
 *   a = sin²(Δφ/2) + cos(φ₁) · cos(φ₂) · sin²(Δλ/2)
 *   c = 2 · atan2(√a, √(1−a))
 *   d = R · c
 *
 * @param {number} lat1  Latitude  of point 1 (decimal degrees).
 * @param {number} lng1  Longitude of point 1 (decimal degrees).
 * @param {number} lat2  Latitude  of point 2 (decimal degrees).
 * @param {number} lng2  Longitude of point 2 (decimal degrees).
 * @returns {number} Distance in kilometres (≥ 0).
 *
 * @example
 *   // Distance between New Delhi & Mumbai ≈ 1,153 km
 *   haversineDistance(28.6139, 77.2090, 19.0760, 72.8777);
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  // ---- Input validation ------------------------------------------- //
  if ([lat1, lng1, lat2, lng2].some((v) => typeof v !== 'number' || Number.isNaN(v))) {
    throw new Error(
      'haversineDistance() requires four numeric arguments (lat1, lng1, lat2, lng2).'
    );
  }

  // ---- Convert degrees → radians ---------------------------------- //
  const phi1    = toRadians(lat1);
  const phi2    = toRadians(lat2);
  const deltaPhi    = toRadians(lat2 - lat1);     // Δφ
  const deltaLambda = toRadians(lng2 - lng1);     // Δλ

  // ---- Haversine formula ------------------------------------------ //
  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_KM * c;

  return distance;
}

/* ─────────────────── Distance Matrix Builder ────────────────────── */

/**
 * Build a symmetric n×n distance matrix from an array of locations.
 *
 * matrix[i][j] = matrix[j][i] = haversine distance (km) between
 * locations[i] and locations[j].  Diagonal entries are 0.
 *
 * @param {Array<{lat: number, lng: number}>} locations
 *   Each element must have at least `lat` and `lng` properties.
 * @returns {number[][]} Symmetric n×n matrix of distances in km.
 * @throws {Error} If locations is empty or contains invalid entries.
 *
 * @example
 *   const locs = [
 *     { lat: 28.61, lng: 77.23 },
 *     { lat: 28.63, lng: 77.21 },
 *     { lat: 28.65, lng: 77.25 },
 *   ];
 *   const dm = buildDistanceMatrix(locs);
 *   // dm[0][1] === dm[1][0], dm[i][i] === 0
 */
function buildDistanceMatrix(locations) {
  // ---- Validation ------------------------------------------------- //
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error('buildDistanceMatrix() requires a non-empty array of locations.');
  }

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    if (loc == null || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
      throw new Error(
        `Location at index ${i} is invalid — expected { lat: number, lng: number }.`
      );
    }
    if (loc.lat < -90 || loc.lat > 90) {
      throw new Error(`Location at index ${i} has out-of-range latitude (${loc.lat}).`);
    }
    if (loc.lng < -180 || loc.lng > 180) {
      throw new Error(`Location at index ${i} has out-of-range longitude (${loc.lng}).`);
    }
  }

  const n = locations.length;

  // ---- Allocate matrix (n × n, filled with 0) --------------------- //
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));

  // ---- Fill upper triangle + mirror to lower triangle ------------- //
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversineDistance(
        locations[i].lat, locations[i].lng,
        locations[j].lat, locations[j].lng
      );

      // Round to 4 decimal places (≈ 0.1 m precision) to avoid
      // floating-point artefacts in downstream algorithms.
      const rounded = Math.round(d * 10000) / 10000;

      matrix[i][j] = rounded;
      matrix[j][i] = rounded;   // symmetric
    }
  }

  return matrix;
}

/* ═══════════════════════════ Module Exports ═══════════════════════════ */

module.exports = {
  toRadians,
  haversineDistance,
  buildDistanceMatrix,
  EARTH_RADIUS_KM,
};
