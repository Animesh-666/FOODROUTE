# Database Design

## 1. Entity-Relationship Overview

The database `smart_food_delivery` consists of 8 interconnected tables.

### Core Tables
1. **`users`**: Central identity table for Customers, Admins, and Agents. Distinguishes roles via an `ENUM`.
2. **`food_items`**: The restaurant menu catalog.
3. **`orders`**: The core transactional entity tracking customer purchases and delivery states.

### Relational Tables
4. **`cart`**: Maps `users` to `food_items` temporarily.
5. **`order_items`**: Maps `orders` to `food_items` permanently (capturing the price at the time of purchase).
6. **`delivery_agents`**: Extends `users` with agent-specific data (vehicle type, current GPS coordinates, availability).
7. **`routes`**: Represents an algorithmic execution result assigned to an agent.
8. **`route_stops`**: Maps `routes` to `orders`, defining the exact sequence (stop order) of the TSP path.

## 2. Key Constraints & Foreign Keys
- `ON DELETE CASCADE` is utilized for cart items (if a food item is deleted, it leaves carts).
- Order items use strict constraints. Food names and prices are duplicated into `order_items` at checkout to ensure historical invoice integrity even if a food item's price is later changed in `food_items`.
- `UNIQUE KEY unique_cart_item (user_id, food_id)` prevents the same item from taking up multiple rows in the cart, forcing quantity updates instead.

## 3. Indexing Strategy
To ensure database performance scales:
- **B-Tree Indexes**: Applied to `users.email`, `users.role`, `orders.status`, and `orders.agent_id`.
- **Fulltext Indexes**: Applied to `food_items.name` and `food_items.description` to power the frontend search bar efficiently.
