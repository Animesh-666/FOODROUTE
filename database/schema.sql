-- =================================================
-- Smart Food Delivery Route Planner
-- Complete Database Schema + Seed Data
-- =================================================
-- 
-- Run this file to set up the database:
--   mysql -u root -p < database/schema.sql
--
-- This creates the database, all 7 tables,
-- indexes, foreign keys, and inserts sample data.
-- =================================================

-- Create database
CREATE DATABASE IF NOT EXISTS smart_food_delivery
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smart_food_delivery;

-- =================================================
-- TABLE: users
-- =================================================
-- Stores all users (customers, admins, delivery agents)

DROP TABLE IF EXISTS delivery_routes;
DROP TABLE IF EXISTS delivery_agents;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS food_items;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,            -- bcrypt hash
    phone VARCHAR(15) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    latitude DECIMAL(10, 8) DEFAULT NULL,
    longitude DECIMAL(11, 8) DEFAULT NULL,
    role ENUM('customer', 'admin', 'delivery_agent') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- =================================================
-- TABLE: food_items
-- =================================================
-- Stores the food menu with categories, pricing, and availability

CREATE TABLE food_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT DEFAULT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    is_veg BOOLEAN DEFAULT TRUE,
    preparation_time INT DEFAULT 15,           -- in minutes
    rating DECIMAL(2, 1) DEFAULT 4.0,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_food_category (category),
    INDEX idx_food_available (is_available),
    INDEX idx_food_price (price),
    INDEX idx_food_veg (is_veg),
    FULLTEXT INDEX idx_food_search (name, description)
) ENGINE=InnoDB;

-- =================================================
-- TABLE: cart
-- =================================================
-- Stores cart items for each user (temporary, before order)

CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate food items in same user's cart
    UNIQUE KEY unique_cart_item (user_id, food_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_items(id) ON DELETE CASCADE,
    
    INDEX idx_cart_user (user_id)
) ENGINE=InnoDB;

-- =================================================
-- TABLE: orders
-- =================================================
-- Stores placed orders with delivery info and status tracking

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') 
        DEFAULT 'pending',
    delivery_address TEXT NOT NULL,
    delivery_lat DECIMAL(10, 8) DEFAULT NULL,
    delivery_lng DECIMAL(11, 8) DEFAULT NULL,
    agent_id INT DEFAULT NULL,
    payment_method VARCHAR(30) DEFAULT 'cod',
    notes TEXT DEFAULT NULL,
    tracking_id VARCHAR(20) DEFAULT NULL,
    estimated_delivery TIMESTAMP NULL DEFAULT NULL,
    delivered_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_agent (agent_id),
    INDEX idx_orders_tracking (tracking_id),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

-- =================================================
-- TABLE: order_items
-- =================================================
-- Stores individual items within an order (price snapshot)

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_id INT DEFAULT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,             -- price at time of order
    food_name VARCHAR(150) NOT NULL,           -- name snapshot
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES food_items(id) ON DELETE SET NULL,
    
    INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- =================================================
-- TABLE: delivery_agents
-- =================================================
-- Extended info for users with role 'delivery_agent'

CREATE TABLE delivery_agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    vehicle_type VARCHAR(30) DEFAULT 'bike',
    is_available BOOLEAN DEFAULT TRUE,
    current_lat DECIMAL(10, 8) DEFAULT NULL,
    current_lng DECIMAL(11, 8) DEFAULT NULL,
    total_deliveries INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_agent_available (is_available),
    INDEX idx_agent_user (user_id)
) ENGINE=InnoDB;

-- Add foreign key from orders to delivery_agents
ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_agent 
    FOREIGN KEY (agent_id) REFERENCES delivery_agents(id) ON DELETE SET NULL;

-- =================================================
-- TABLE: delivery_routes
-- =================================================
-- Stores optimized delivery routes computed by TSP algorithms

CREATE TABLE delivery_routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    order_ids JSON NOT NULL,                   -- Array of order IDs in this route
    algorithm_used VARCHAR(50) NOT NULL,
    route_data JSON NOT NULL,                  -- Ordered waypoints [{lat, lng, order_id, address}]
    total_distance_km DECIMAL(10, 3) NOT NULL,
    estimated_time_min INT NOT NULL,
    execution_time_ms DECIMAL(10, 4) NOT NULL, -- Algorithm execution time
    status ENUM('planned', 'in_progress', 'completed') DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (agent_id) REFERENCES delivery_agents(id) ON DELETE CASCADE,
    
    INDEX idx_route_agent (agent_id),
    INDEX idx_route_status (status)
) ENGINE=InnoDB;


-- =================================================
-- SEED DATA
-- =================================================

-- -------------------------------------------------
-- Default Admin User
-- Password: admin123 (bcrypt hashed)
-- -------------------------------------------------
INSERT INTO users (name, email, password, phone, role, address, latitude, longitude) VALUES
('Admin User', 'admin@foodroute.com', '$2a$10$YJKHxE6WOWMBfL3bKH5VD.qGZIaB5VYzb0OxhXuVH.BYJ1MAqGpGm', '9999999999', 'admin', 'FoodRoute HQ, Connaught Place, New Delhi', 28.6315, 77.2167);

-- -------------------------------------------------
-- Sample Customers
-- Password: customer123 (bcrypt hashed)
-- -------------------------------------------------
INSERT INTO users (name, email, password, phone, role, address, latitude, longitude) VALUES
('Rahul Sharma', 'rahul@example.com', '$2a$10$YJKHxE6WOWMBfL3bKH5VD.qGZIaB5VYzb0OxhXuVH.BYJ1MAqGpGm', '9876543210', 'customer', '42, Hauz Khas Village, New Delhi', 28.5494, 77.2001),
('Priya Patel', 'priya@example.com', '$2a$10$YJKHxE6WOWMBfL3bKH5VD.qGZIaB5VYzb0OxhXuVH.BYJ1MAqGpGm', '9876543211', 'customer', '15, Lajpat Nagar, New Delhi', 28.5677, 77.2433),
('Amit Kumar', 'amit@example.com', '$2a$10$YJKHxE6WOWMBfL3bKH5VD.qGZIaB5VYzb0OxhXuVH.BYJ1MAqGpGm', '9876543212', 'customer', '78, Karol Bagh, New Delhi', 28.6519, 77.1905),
('Neha Gupta', 'neha@example.com', '$2a$10$YJKHxE6WOWMBfL3bKH5VD.qGZIaB5VYzb0OxhXuVH.BYJ1MAqGpGm', '9876543213', 'customer', '23, Dwarka Sector 7, New Delhi', 28.5823, 77.0727),
('Vikram Singh', 'vikram@example.com', '$2a$10$YJKHxE6WOWMBfL3bKH5VD.qGZIaB5VYzb0OxhXuVH.BYJ1MAqGpGm', '9876543214', 'customer', '56, Rohini Sector 9, New Delhi', 28.7277, 77.1154);

-- -------------------------------------------------
-- Sample Delivery Agents
-- Password: delivery123 (bcrypt hashed)
-- -------------------------------------------------
INSERT INTO users (name, email, password, phone, role, address, latitude, longitude) VALUES
('Ravi Driver', 'ravi@delivery.com', '$2a$10$YJKHxE6WOWMBfL3bKH5VD.qGZIaB5VYzb0OxhXuVH.BYJ1MAqGpGm', '9111111111', 'delivery_agent', 'Near India Gate, New Delhi', 28.6129, 77.2295),
('Suresh Rider', 'suresh@delivery.com', '$2a$10$YJKHxE6WOWMBfL3bKH5VD.qGZIaB5VYzb0OxhXuVH.BYJ1MAqGpGm', '9222222222', 'delivery_agent', 'Janpath, New Delhi', 28.6205, 77.2180),
('Manoj Biker', 'manoj@delivery.com', '$2a$10$YJKHxE6WOWMBfL3bKH5VD.qGZIaB5VYzb0OxhXuVH.BYJ1MAqGpGm', '9333333333', 'delivery_agent', 'Sarojini Nagar, New Delhi', 28.5745, 77.2001);

-- Create delivery agent records
INSERT INTO delivery_agents (user_id, vehicle_type, is_available, current_lat, current_lng) VALUES
((SELECT id FROM users WHERE email = 'ravi@delivery.com'), 'bike', TRUE, 28.6129, 77.2295),
((SELECT id FROM users WHERE email = 'suresh@delivery.com'), 'scooter', TRUE, 28.6205, 77.2180),
((SELECT id FROM users WHERE email = 'manoj@delivery.com'), 'bike', TRUE, 28.5745, 77.2001);

-- -------------------------------------------------
-- Sample Food Items (30 items across categories)
-- -------------------------------------------------
INSERT INTO food_items (name, description, price, category, is_veg, preparation_time, rating, image_url) VALUES
-- Burgers
('Classic Veggie Burger', 'Crispy aloo tikki patty with fresh lettuce, tomato, onions, and our signature sauce in a toasted bun.', 149.00, 'Burgers', TRUE, 12, 4.3, '/img/food/veggie-burger.jpg'),
('Paneer Tikka Burger', 'Smoky grilled paneer tikka with mint chutney, pickled onions, and spicy mayo.', 179.00, 'Burgers', TRUE, 15, 4.5, '/img/food/paneer-burger.jpg'),
('Chicken Zinger Burger', 'Crispy fried chicken fillet with coleslaw, jalapeños, and chipotle sauce.', 199.00, 'Burgers', FALSE, 15, 4.6, '/img/food/chicken-burger.jpg'),
('Double Smash Burger', 'Two smashed beef patties with melted cheese, caramelized onions, and BBQ glaze.', 249.00, 'Burgers', FALSE, 18, 4.7, '/img/food/smash-burger.jpg'),

-- Pizza
('Margherita Pizza', 'Classic hand-tossed pizza with San Marzano tomato sauce, fresh mozzarella, and basil.', 199.00, 'Pizza', TRUE, 20, 4.4, '/img/food/margherita.jpg'),
('Farmhouse Pizza', 'Loaded with capsicum, onions, tomatoes, mushrooms, and black olives on a cheesy base.', 249.00, 'Pizza', TRUE, 20, 4.3, '/img/food/farmhouse.jpg'),
('Pepperoni Pizza', 'Generous pepperoni slices with mozzarella and oregano on a thin crust.', 299.00, 'Pizza', FALSE, 20, 4.8, '/img/food/pepperoni.jpg'),
('BBQ Chicken Pizza', 'Tender chicken chunks with BBQ sauce, red onions, and smoked gouda.', 329.00, 'Pizza', FALSE, 22, 4.6, '/img/food/bbq-chicken-pizza.jpg'),

-- Biryani
('Veg Dum Biryani', 'Fragrant basmati rice layered with mixed vegetables and aromatic spices, slow-cooked in dum style.', 199.00, 'Biryani', TRUE, 25, 4.2, '/img/food/veg-biryani.jpg'),
('Hyderabadi Chicken Biryani', 'Authentic Hyderabadi-style biryani with tender chicken, saffron rice, and fried onions.', 279.00, 'Biryani', FALSE, 30, 4.8, '/img/food/chicken-biryani.jpg'),
('Mutton Biryani', 'Premium mutton pieces in richly spiced biryani with boiled eggs and raita.', 349.00, 'Biryani', FALSE, 35, 4.7, '/img/food/mutton-biryani.jpg'),
('Egg Biryani', 'Fluffy basmati rice with boiled eggs, caramelized onions, and mild spices.', 189.00, 'Biryani', FALSE, 20, 4.1, '/img/food/egg-biryani.jpg'),

-- Chinese
('Veg Manchurian', 'Crispy vegetable balls tossed in spicy Indo-Chinese manchurian sauce.', 159.00, 'Chinese', TRUE, 15, 4.3, '/img/food/veg-manchurian.jpg'),
('Chicken Fried Rice', 'Wok-tossed fried rice with chicken, eggs, spring onions, and soy sauce.', 189.00, 'Chinese', FALSE, 15, 4.4, '/img/food/chicken-fried-rice.jpg'),
('Paneer Chilli', 'Crispy paneer cubes stir-fried with bell peppers, onions, and fiery chilli sauce.', 179.00, 'Chinese', TRUE, 15, 4.5, '/img/food/paneer-chilli.jpg'),
('Hakka Noodles', 'Stir-fried egg noodles with vegetables, garlic, and Indo-Chinese spices.', 149.00, 'Chinese', TRUE, 12, 4.2, '/img/food/hakka-noodles.jpg'),

-- South Indian
('Masala Dosa', 'Crispy golden dosa filled with spiced potato masala, served with sambar and chutneys.', 99.00, 'South Indian', TRUE, 12, 4.6, '/img/food/masala-dosa.jpg'),
('Idli Sambar', 'Soft steamed idlis (4 pcs) served with hot sambar and coconut chutney.', 79.00, 'South Indian', TRUE, 10, 4.3, '/img/food/idli-sambar.jpg'),
('Medu Vada', 'Crispy golden lentil donuts (3 pcs) served with sambar and coconut chutney.', 89.00, 'South Indian', TRUE, 12, 4.2, '/img/food/medu-vada.jpg'),
('Uttapam', 'Thick rice pancake topped with onions, tomatoes, and green chillies.', 109.00, 'South Indian', TRUE, 12, 4.1, '/img/food/uttapam.jpg'),

-- North Indian
('Dal Makhani', 'Creamy black lentils slow-cooked overnight with butter, cream, and aromatic spices.', 189.00, 'North Indian', TRUE, 10, 4.7, '/img/food/dal-makhani.jpg'),
('Butter Chicken', 'Tender chicken in rich, creamy tomato-butter sauce with kasuri methi.', 269.00, 'North Indian', FALSE, 20, 4.9, '/img/food/butter-chicken.jpg'),
('Paneer Butter Masala', 'Soft paneer cubes in velvety tomato-cashew gravy with a touch of cream.', 219.00, 'North Indian', TRUE, 15, 4.6, '/img/food/paneer-butter.jpg'),
('Chole Bhature', 'Spiced chickpea curry with fluffy deep-fried bhature and pickled onions.', 149.00, 'North Indian', TRUE, 15, 4.5, '/img/food/chole-bhature.jpg'),

-- Desserts
('Gulab Jamun (4 pcs)', 'Soft milk-solid dumplings soaked in rose-cardamom sugar syrup.', 99.00, 'Desserts', TRUE, 5, 4.6, '/img/food/gulab-jamun.jpg'),
('Chocolate Brownie', 'Rich, fudgy dark chocolate brownie with walnuts and vanilla ice cream.', 149.00, 'Desserts', TRUE, 5, 4.7, '/img/food/brownie.jpg'),
('Rasmalai (4 pcs)', 'Soft cottage cheese patties in sweetened saffron milk with pistachios.', 129.00, 'Desserts', TRUE, 5, 4.5, '/img/food/rasmalai.jpg'),

-- Beverages
('Mango Lassi', 'Thick and creamy yogurt-based mango drink with a hint of cardamom.', 79.00, 'Beverages', TRUE, 5, 4.4, '/img/food/mango-lassi.jpg'),
('Cold Coffee', 'Chilled coffee blended with milk, ice cream, and chocolate syrup.', 99.00, 'Beverages', TRUE, 5, 4.5, '/img/food/cold-coffee.jpg'),
('Masala Chai', 'Authentic Indian spiced tea with ginger, cardamom, and fresh milk.', 39.00, 'Beverages', TRUE, 5, 4.3, '/img/food/masala-chai.jpg'),
('Fresh Lime Soda', 'Freshly squeezed lime with soda, mint, and a pinch of black salt.', 49.00, 'Beverages', TRUE, 3, 4.2, '/img/food/lime-soda.jpg');


-- -------------------------------------------------
-- Sample Orders (for testing)
-- -------------------------------------------------
INSERT INTO orders (user_id, total_amount, status, delivery_address, delivery_lat, delivery_lng, payment_method, tracking_id, notes) VALUES
(2, 528.00, 'pending', '42, Hauz Khas Village, New Delhi', 28.5494, 77.2001, 'cod', 'FD-2025-ABC123', 'Please ring the bell twice'),
(3, 279.00, 'confirmed', '15, Lajpat Nagar, New Delhi', 28.5677, 77.2433, 'upi', 'FD-2025-DEF456', NULL),
(4, 647.00, 'preparing', '78, Karol Bagh, New Delhi', 28.6519, 77.1905, 'online', 'FD-2025-GHI789', 'Extra spicy'),
(5, 348.00, 'out_for_delivery', '23, Dwarka Sector 7, New Delhi', 28.5823, 77.0727, 'cod', 'FD-2025-JKL012', NULL),
(6, 199.00, 'delivered', '56, Rohini Sector 9, New Delhi', 28.7277, 77.1154, 'card', 'FD-2025-MNO345', 'Leave at door');

-- Order items for order 1
INSERT INTO order_items (order_id, food_id, quantity, price, food_name) VALUES
(1, 10, 1, 279.00, 'Hyderabadi Chicken Biryani'),
(1, 3, 1, 199.00, 'Chicken Zinger Burger'),
(1, 28, 1, 49.00, 'Fresh Lime Soda');

-- Order items for order 2
INSERT INTO order_items (order_id, food_id, quantity, price, food_name) VALUES
(2, 10, 1, 279.00, 'Hyderabadi Chicken Biryani');

-- Order items for order 3
INSERT INTO order_items (order_id, food_id, quantity, price, food_name) VALUES
(3, 22, 2, 269.00, 'Butter Chicken'),
(3, 21, 1, 189.00, 'Dal Makhani');

-- Order items for order 4
INSERT INTO order_items (order_id, food_id, quantity, price, food_name) VALUES
(4, 5, 1, 199.00, 'Margherita Pizza'),
(4, 1, 1, 149.00, 'Classic Veggie Burger');

-- Order items for order 5
INSERT INTO order_items (order_id, food_id, quantity, price, food_name) VALUES
(5, 17, 2, 99.00, 'Masala Dosa');

-- Assign agent to order 4 (out_for_delivery)
UPDATE orders SET agent_id = 1 WHERE id = 4;

-- Assign agent to order 5 (delivered)
UPDATE orders SET agent_id = 2, delivered_at = NOW() WHERE id = 5;


-- =================================================
-- VERIFICATION QUERIES (uncomment to test)
-- =================================================
-- SELECT COUNT(*) AS total_users FROM users;
-- SELECT COUNT(*) AS total_food_items FROM food_items;
-- SELECT COUNT(*) AS total_orders FROM orders;
-- SELECT * FROM users WHERE role = 'admin';
-- SELECT * FROM food_items LIMIT 5;
-- SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON o.user_id = u.id;
