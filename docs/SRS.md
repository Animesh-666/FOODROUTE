# Software Requirements Specification (SRS)

## 1. Introduction
The **Smart Food Delivery Route Planner** is a full-stack web application designed to optimize the food delivery lifecycle. It serves three distinct user bases: Customers, Administrators, and Delivery Agents, and integrates Design & Analysis of Algorithms (DAA) concepts to optimize delivery routing.

## 2. Overall Description
### 2.1 Product Perspective
The system operates as an independent web platform replacing traditional manual dispatching. It utilizes modern web technologies and a relational database to ensure data integrity and real-time responsiveness.

### 2.2 User Classes and Characteristics
1. **Customer**: Can browse food, place orders, and track delivery status.
2. **Administrator**: Manages the menu, oversees all orders, and utilizes the DAA Route Planner to batch orders and dispatch agents.
3. **Delivery Agent**: Receives assigned routes, navigates to customers using a map interface, and updates order statuses to "Delivered".

## 3. Specific Requirements
### 3.1 Functional Requirements
- **FR1**: The system must allow users to register and authenticate via JWT securely.
- **FR2**: The system must provide a shopping cart with real-time total calculation.
- **FR3**: The system must allow admins to view all pending orders and group up to 10 orders into a single delivery run.
- **FR4**: The system must calculate the optimal delivery route using TSP algorithms (Greedy, Held-Karp DP, MST Approximation).
- **FR5**: The system must plot the calculated route on an interactive map.
- **FR6**: The system must allow agents to share their live GPS location and mark orders as delivered.

### 3.2 Non-Functional Requirements
- **NFR1 (Performance)**: API response times should be under 200ms. Route optimization for $N \le 10$ must execute in under 1 second.
- **NFR2 (Security)**: Passwords must be hashed using bcrypt. All API endpoints must be protected by Role-Based Access Control (RBAC).
- **NFR3 (Usability)**: The UI must be responsive, defaulting to a mobile-first design for the Delivery Agent portal.
