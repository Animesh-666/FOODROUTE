# Installation & Deployment Guide

## 1. Prerequisites
Before setting up the project, ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **MySQL Server** (v8.0 or higher)
- **Git** (optional, for version control)

## 2. Local Installation

### Step 1: Extract/Clone the Project
Navigate to the project root directory:
```bash
cd "c:\Users\ANIMESH\'B-TECH CSE'\2ND YEAR\4TH SEM\MINI PROJECT"
```

### Step 2: Install Node Dependencies
Run the following command to install all backend packages (Express, MySQL2, bcryptjs, jsonwebtoken, etc.):
```bash
npm install
```

### Step 3: Database Configuration
1. Open your MySQL command line or MySQL Workbench.
2. Run the provided schema file to build the database and seed it with sample data:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   *Enter your MySQL root password when prompted.*

### Step 4: Environment Variables
Create a file named `.env` in the root folder (or rename `.env.example` to `.env`) and configure it:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=smart_food_delivery
JWT_SECRET=super_secret_key_for_mini_project
NODE_ENV=development
```

### Step 5: Start the Server
Start the Express server:
```bash
npm start
```
*If developing, you can use `npm run dev` to start with nodemon for hot-reloading.*

The server will output: `Server running on port 3000`.

### Step 6: Access the Application
Open your web browser and navigate to: **`http://localhost:3000`**

---

## 3. Production Deployment Guidelines

If you intend to host this project on a live server (e.g., AWS EC2, Heroku, DigitalOcean, Render):

### Frontend Hosting
Because the frontend is built using standard HTML/CSS/JS without a bundler, it is served statically via Express (`app.use(express.static('public'))`). No separate frontend hosting (like Vercel or Netlify) is required.

### Backend Hosting
1. Set `NODE_ENV=production` in your server environment variables.
2. Ensure you generate a strong, cryptographically secure string for `JWT_SECRET`.
3. Use a process manager like **PM2** to keep the Node server running:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "food-delivery-api"
   ```

### Database Hosting
Use a managed database service like **Amazon RDS** or **PlanetScale**. Update the `.env` DB variables with the cloud host credentials.

### Security Reminders
- Ensure CORS is properly configured in `server.js` if you ever split the frontend to a different domain.
- Use HTTPS in production to encrypt JWT tokens sent in the Authorization headers.
