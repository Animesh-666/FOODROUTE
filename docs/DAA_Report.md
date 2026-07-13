# Design & Analysis of Algorithms (DAA) Report

## 1. Introduction
This project implements solutions to the **Traveling Salesperson Problem (TSP)** applied to food delivery routing. Given a central kitchen (Depot) and a set of delivery locations, the objective is to find the shortest possible route that visits every location exactly once and returns to the depot.

## 2. Graph Construction
- **Nodes**: Depot (Node 0) + Delivery Locations (Nodes 1 to N).
- **Edges**: Complete graph where every node is connected to every other node.
- **Weights**: Distances calculated using the **Haversine Formula**, which determines the great-circle distance between two points on a sphere given their longitudes and latitudes.

## 3. Algorithm 1: Greedy Nearest Neighbor (Heuristic)
### Explanation
Starting at the depot, the algorithm iteratively visits the nearest unvisited node until all nodes are visited, then returns to the depot.

### Complexity
- **Time Complexity**: $O(n^2)$ — At each of the $n$ steps, it scans up to $n$ remaining nodes to find the minimum distance.
- **Space Complexity**: $O(n)$ — To store the visited set and the path.

### Evaluation
Very fast, but often yields sub-optimal paths (can be up to $20-30\%$ longer than the optimal route).

## 4. Algorithm 2: Held-Karp Dynamic Programming (Exact)
### Explanation
Uses Bitmask DP to systematically evaluate all possible paths without redundant calculations. Let `dp(mask, i)` be the minimum cost to visit a set of nodes represented by `mask`, ending at node `i`.

### Complexity
- **Time Complexity**: $O(n^2 2^n)$ — There are $2^n$ possible subsets and $n$ possible ending nodes. For each state, it takes $O(n)$ to calculate the minimum.
- **Space Complexity**: $O(n 2^n)$ — To store the DP table and parent pointers for path reconstruction.

### Evaluation
Guarantees the absolute shortest path. However, due to exponential growth, it is computationally infeasible for $n > 20$. In this project, it is restricted to bundles of $\le 10$ orders.

## 5. Algorithm 3: MST 2-Approximation
### Explanation
1. Constructs a Minimum Spanning Tree (MST) using Prim's algorithm.
2. Performs a Depth-First Search (DFS) pre-order traversal of the MST.
3. Uses triangle inequality shortcuts to form a Hamiltonian cycle.

### Complexity
- **Time Complexity**: $O(n^2)$ — Prim's algorithm takes $O(n^2)$ using an adjacency matrix, and DFS takes $O(n)$.
- **Space Complexity**: $O(n)$ — For storing the MST and recursion stack.

### Evaluation
Guarantees a route length no worse than $2 \times$ the optimal path ($2$-Approximation). It provides a strong balance between execution speed and route efficiency for larger datasets.

## 6. Real-World Application
The `tsp.js` module acts as a comparator. It runs all three algorithms simultaneously, logs their execution times using `process.hrtime.bigint()`, and outputs the results to the Admin UI, providing a practical visual demonstration of DAA theory in a production environment.
