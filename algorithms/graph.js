/**
 * ============================================================
 *  Smart Food Delivery Route Planner — Graph Data Structure
 * ============================================================
 *  Module  : algorithms/graph.js
 *  Purpose : Weighted, undirected graph backed by an adjacency
 *            matrix.  Designed for city-scale delivery networks
 *            where every location may connect to every other.
 *  Exports : Graph (class)
 * ============================================================
 */

'use strict';

/**
 * @class Graph
 * @description Weighted undirected graph stored as a symmetric
 *              adjacency matrix.  Nodes carry metadata (id,
 *              name, lat, lng) so the graph can be visualised
 *              on a Leaflet map.
 *
 * @example
 *   const Graph = require('./graph');
 *   const g = new Graph([
 *     { id: 1, name: 'Depot',      lat: 28.61, lng: 77.23 },
 *     { id: 2, name: 'Customer A', lat: 28.63, lng: 77.21 },
 *   ]);
 *   g.setEdge(0, 1, 4.5);          // 4.5 km between node-0 and node-1
 *   console.log(g.getNeighbors(0)); // [{ node: 1, weight: 4.5 }]
 */
class Graph {

  /* ──────────────────────────── Constructor ──────────────────────────── */

  /**
   * Build a graph from an array of location objects.
   *
   * @param {Array<{id: number|string, name: string, lat: number, lng: number}>} locations
   *   Each element is a delivery stop or depot.
   */
  constructor(locations = []) {
    /**
     * @type {Array<{id: number|string, name: string, lat: number, lng: number}>}
     * Ordered list of nodes — index in this array = matrix row/col.
     */
    this.nodes = [];

    /**
     * @type {number[][]}
     * Symmetric n×n matrix.  matrix[i][j] = edge weight (km).
     * Infinity means no direct edge.
     */
    this.matrix = [];

    // Populate from the supplied locations
    for (const loc of locations) {
      this.addNode(loc);
    }
  }

  /* ──────────────────────────── Node ops ─────────────────────────────── */

  /**
   * Add a node to the graph.  Expands the adjacency matrix by one
   * row and one column (all set to Infinity = no edge).
   *
   * @param {{id: number|string, name: string, lat: number, lng: number}} location
   * @returns {number} The matrix index of the new node.
   * @throws {Error} If location data is missing required fields.
   */
  addNode(location) {
    // --- Validation -------------------------------------------------- //
    if (!location || typeof location !== 'object') {
      throw new Error('addNode() expects a location object with id, name, lat, lng.');
    }
    if (location.lat == null || location.lng == null) {
      throw new Error(`Location "${location.name || location.id}" is missing lat/lng.`);
    }

    const idx = this.nodes.length;

    // Store node metadata
    this.nodes.push({
      id:   location.id   ?? idx,
      name: location.name ?? `Node-${idx}`,
      lat:  Number(location.lat),
      lng:  Number(location.lng),
    });

    // Expand existing rows by one column
    for (let r = 0; r < idx; r++) {
      this.matrix[r].push(Infinity);
    }

    // Add new row (length = idx + 1); distance to self = 0
    const newRow = new Array(idx + 1).fill(Infinity);
    newRow[idx] = 0;
    this.matrix.push(newRow);

    return idx;
  }

  /**
   * Remove a node by its matrix index.  Shrinks the matrix and
   * renumbers all subsequent indices.
   *
   * @param {number} index  Matrix index of the node to remove.
   * @throws {Error} If index is out of range.
   */
  removeNode(index) {
    if (index < 0 || index >= this.nodes.length) {
      throw new Error(`removeNode(): index ${index} out of range [0, ${this.nodes.length - 1}].`);
    }

    // Remove from node list
    this.nodes.splice(index, 1);

    // Remove the row
    this.matrix.splice(index, 1);

    // Remove the column from every remaining row
    for (let r = 0; r < this.matrix.length; r++) {
      this.matrix[r].splice(index, 1);
    }
  }

  /* ──────────────────────────── Edge ops ─────────────────────────────── */

  /**
   * Set (or update) an undirected edge weight.
   *
   * @param {number} i       Source node index.
   * @param {number} j       Destination node index.
   * @param {number} weight  Weight (distance in km).
   */
  setEdge(i, j, weight) {
    this._assertIndex(i);
    this._assertIndex(j);
    if (typeof weight !== 'number' || weight < 0) {
      throw new Error('Edge weight must be a non-negative number.');
    }
    this.matrix[i][j] = weight;
    this.matrix[j][i] = weight;   // symmetric
  }

  /**
   * Remove an edge by resetting its weight to Infinity.
   *
   * @param {number} i  Source node index.
   * @param {number} j  Destination node index.
   */
  removeEdge(i, j) {
    this._assertIndex(i);
    this._assertIndex(j);
    this.matrix[i][j] = Infinity;
    this.matrix[j][i] = Infinity;
  }

  /**
   * Return the weight of the edge between nodes i and j.
   *
   * @param {number} i
   * @param {number} j
   * @returns {number} Edge weight, or Infinity if no edge exists.
   */
  getEdgeWeight(i, j) {
    this._assertIndex(i);
    this._assertIndex(j);
    return this.matrix[i][j];
  }

  /* ──────────────────────────── Queries ──────────────────────────────── */

  /**
   * Get all neighbours of a node (edges with finite weight).
   *
   * @param {number} index  Matrix index of the node.
   * @returns {Array<{node: number, weight: number}>}  Sorted by weight ascending.
   */
  getNeighbors(index) {
    this._assertIndex(index);

    const neighbors = [];
    const row = this.matrix[index];

    for (let j = 0; j < row.length; j++) {
      if (j !== index && row[j] !== Infinity) {
        neighbors.push({ node: j, weight: row[j] });
      }
    }

    // Return sorted so callers can iterate nearest-first
    neighbors.sort((a, b) => a.weight - b.weight);
    return neighbors;
  }

  /**
   * @returns {number} Total number of nodes currently in the graph.
   */
  getNodeCount() {
    return this.nodes.length;
  }

  /**
   * Check whether an edge exists (finite weight, i ≠ j).
   *
   * @param {number} i
   * @param {number} j
   * @returns {boolean}
   */
  hasEdge(i, j) {
    if (i < 0 || i >= this.nodes.length) return false;
    if (j < 0 || j >= this.nodes.length) return false;
    return i !== j && this.matrix[i][j] !== Infinity;
  }

  /* ──────────────────── Adjacency list conversion ───────────────────── */

  /**
   * Convert the adjacency matrix to an adjacency list.
   *
   * @returns {Object<number, Array<{node: number, weight: number}>>}
   *   Keys are node indices; values are sorted neighbour arrays.
   */
  toAdjacencyList() {
    const adjList = {};
    for (let i = 0; i < this.nodes.length; i++) {
      adjList[i] = this.getNeighbors(i);
    }
    return adjList;
  }

  /**
   * Populate the adjacency matrix from an adjacency list.
   * Existing edges are overwritten; unlisted edges become Infinity.
   *
   * @param {Object<number, Array<{node: number, weight: number}>>} adjList
   */
  fromAdjacencyList(adjList) {
    const n = this.nodes.length;

    // Reset matrix
    this.matrix = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity))
    );

    for (const [src, neighbors] of Object.entries(adjList)) {
      const i = Number(src);
      for (const { node: j, weight } of neighbors) {
        if (i >= 0 && i < n && j >= 0 && j < n) {
          this.matrix[i][j] = weight;
          this.matrix[j][i] = weight;   // keep symmetric
        }
      }
    }
  }

  /* ──────────────────────── Serialisation ────────────────────────────── */

  /**
   * Build a JSON-safe plain object representation of the graph.
   *
   * @returns {{ nodes: Array, matrix: number[][] }}
   */
  toJSON() {
    return {
      nodes:  this.nodes,
      matrix: this.matrix,
    };
  }

  /**
   * Restore a graph from a plain object (e.g. parsed from JSON).
   *
   * @param {{ nodes: Array, matrix: number[][] }} obj
   * @returns {Graph}
   */
  static fromJSON(obj) {
    const g = new Graph();
    g.nodes  = obj.nodes  || [];
    g.matrix = obj.matrix || [];
    return g;
  }

  /* ──────────────────────── Pretty-print ─────────────────────────────── */

  /**
   * Human-readable representation of the graph for debugging.
   *
   * @returns {string}
   */
  toString() {
    const n = this.nodes.length;
    if (n === 0) return '[Graph: empty]';

    const lines = [];
    lines.push(`[Graph: ${n} node(s)]`);
    lines.push('');

    // Header row
    const hdr = ['     '];
    for (let j = 0; j < n; j++) {
      hdr.push(String(j).padStart(8));
    }
    lines.push(hdr.join(''));

    // Matrix rows
    for (let i = 0; i < n; i++) {
      const cells = [String(i).padStart(4) + ' '];
      for (let j = 0; j < n; j++) {
        const w = this.matrix[i][j];
        cells.push(w === Infinity ? '     Inf' : w.toFixed(2).padStart(8));
      }
      lines.push(cells.join(''));
    }

    lines.push('');
    lines.push('Nodes:');
    for (let i = 0; i < n; i++) {
      const nd = this.nodes[i];
      lines.push(`  [${i}] ${nd.name} (id=${nd.id}, lat=${nd.lat}, lng=${nd.lng})`);
    }

    return lines.join('\n');
  }

  /* ──────────────────────── Internal helpers ─────────────────────────── */

  /**
   * Throw if index is out of range.
   * @private
   * @param {number} idx
   */
  _assertIndex(idx) {
    if (idx < 0 || idx >= this.nodes.length) {
      throw new Error(`Node index ${idx} is out of range [0, ${this.nodes.length - 1}].`);
    }
  }
}

/* ═══════════════════════════ Module Export ════════════════════════════ */

module.exports = Graph;
