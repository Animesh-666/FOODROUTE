# Project Architecture & Report

## 1. System Architecture
The application is built on a **Monolithic MVC Architecture** utilizing Node.js and Express.

- **Client Layer**: Pure HTML/CSS/JS communicating entirely via asynchronous `fetch` calls. No server-side templating (like EJS or Pug) is used, ensuring strict separation of concerns.
- **Controller Layer**: Handles business logic, input sanitization, and orchestrates calls to the Data Access layer and Algorithm layer.
- **Algorithm Layer**: A standalone, pure-logic module (`algorithms/`) responsible for DAA execution. It operates independently of the database.
- **Data Access Layer**: `models/` contain static classes wrapping MySQL queries, ensuring all SQL logic is abstracted away from controllers.

## 2. Directory Structure
```text
├── algorithms/       # Core DAA logic (TSP, Graph, Haversine)
├── config/           # Database and environment configurations
├── controllers/      # API Request handlers
├── database/         # SQL schema and seed data
├── docs/             # Academic and technical documentation
├── middleware/       # JWT Auth, Role Checking, Error handling
├── models/           # Data access objects (MySQL wrappers)
├── public/           # Frontend assets (HTML, CSS, JS)
│   ├── css/
│   ├── js/
│   └── pages/
├── routes/           # Express router definitions
├── utils/            # Helper functions (constants, token generation)
└── server.js         # Application entry point
```

## 3. UI/UX Design Philosophy
- **Dark Premium Theme**: Deep gradient backgrounds with vibrant accents to minimize eye strain and present a modern aesthetic.
- **Glassmorphism**: Cards and navigation elements utilize `backdrop-filter: blur` to create depth.
- **Mobile-First Delivery App**: The Delivery Agent portal is specifically designed with large touch targets and simplified layouts for use on mobile devices while driving.

## 4. Scalability Considerations
- **Connection Pooling**: `mysql2` connection pools are used to handle concurrent database requests efficiently.
- **Stateless Auth**: JWT eliminates the need for server-side session memory, allowing the Node backend to be horizontally scaled if necessary.
- **Decoupled Algorithms**: The routing algorithms operate on pure arrays of coordinates, meaning they could easily be extracted into a separate Python microservice in the future if computational demands increase.
