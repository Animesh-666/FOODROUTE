# API Documentation

The backend exposes RESTful API endpoints under the `/api` prefix. All protected routes require a JWT token passed in the header: `Authorization: Bearer <token>`.

## Authentication APIs (`/api/auth`)
- `POST /signup` - Register a new customer.
- `POST /login` - Authenticate and receive JWT.
- `GET /profile` - Retrieve logged-in user details.
- `PUT /profile` - Update user details (name, phone, address).

## Food APIs (`/api/food`)
- `GET /` - List all active food items.
- `GET /categories` - Get distinct categories.
- `GET /:id` - Get specific food item details.

## Cart APIs (`/api/cart`)
*(Requires Authentication)*
- `GET /` - View current user's cart.
- `POST /add` - Add food item to cart.
- `PUT /update` - Update item quantity.
- `DELETE /remove/:id` - Remove item from cart.
- `DELETE /clear` - Empty cart.

## Order APIs (`/api/orders`)
*(Requires Authentication)*
- `POST /checkout` - Convert cart to a confirmed order. Requires delivery coordinates.
- `GET /history` - Get user's past orders.
- `GET /:id` - Get specific order details.

## Admin APIs (`/api/admin`)
*(Requires Admin Role)*
- `GET /dashboard/stats` - Revenue, active orders, customer metrics.
- `GET /orders` - List all orders across the platform.
- `PUT /orders/:id/status` - Manually update order status.
- `PUT /orders/:id/assign` - Assign a delivery agent to an order.
- `POST /food` - Create a new menu item.
- `PUT /food/:id` - Edit menu item.

## Delivery Agent APIs (`/api/delivery`)
*(Requires Delivery Agent Role)*
- `GET /dashboard` - Get assigned active route and daily stats.
- `PUT /availability` - Toggle online/offline status.
- `PUT /location` - Sync current GPS coordinates.
- `PUT /orders/:id/deliver` - Mark a specific order as delivered.

## Route Planner (DAA) APIs (`/api/routes`)
*(Requires Admin Role)*
- `GET /map-data` - Fetches depot coordinates, unassigned orders, and available agents for mapping.
- `POST /optimize` - Accepts an array of `order_ids`. Runs TSP algorithms and returns the optimal sequence, distances, and execution times.
