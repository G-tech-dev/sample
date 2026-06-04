# VRS - Vehicle Rental System

A full-stack vehicle rental management system built with React, Express, and MongoDB.

## Features

- Customer management
- Vehicle inventory management
- Reservation and rental tracking
- Return vehicle processing
- Dashboard with real-time statistics
- User authentication

## Prerequisites

Before installing, ensure you have the following software installed on your machine:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/downloads)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/G-tech-dev/legend.git
cd legend
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

Open a new terminal and run:

```bash
cd frontend/vrs
npm install
```

## Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
MONGODB_URI=mongodb://localhost:27017/vrs
SESSION_SECRET=your_session_secret_here
PORT=5000
```

### Frontend Configuration

The frontend is configured to run on port 5173 by default. No additional configuration is required unless you need to change the backend URL.

## Running the Application

### 1. Start MongoDB

Make sure MongoDB is running on your machine:

**Windows:**
```bash
net start MongoDB
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
```

Or use the MongoDB Compass application.

### 2. Start the Backend Server

In the `backend` directory:

```bash
npm start
```

The backend server will run on `http://localhost:5000`

### 3. Start the Frontend Development Server

In a new terminal, in the `frontend/vrs` directory:

```bash
cd frontend/vrs
npm run dev
```

The frontend application will run on `http://localhost:5173`

## Project Structure

```
legend/
├── backend/
│   ├── server.js          # Express server with all API routes
│   ├── package.json       # Backend dependencies
│   └── .env               # Environment variables (create this)
├── frontend/
│   ├── package.json       # Root frontend config
│   ├── vite.config.js     # Vite configuration
│   └── vrs/
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── api.js         # API configuration
│       │   └── App.jsx        # Main app component
│       └── package.json       # Frontend dependencies
└── README.md
```

## Available Scripts

### Backend
- `npm start` - Start the backend server with nodemon

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create a new customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Create a new vehicle
- `PUT /api/vehicles/:id` - Update a vehicle
- `DELETE /api/vehicles/:id` - Delete a vehicle

### Reservations
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create a new reservation
- `PUT /api/reservations/:id` - Update a reservation
- `PUT /api/reservations/return/:id` - Return a vehicle
- `DELETE /api/reservations/:id` - Delete a reservation

## Tech Stack

### Backend
- Express.js
- MongoDB with Mongoose
- bcrypt for password hashing
- express-session with connect-mongo for session management
- CORS enabled

### Frontend
- React 19
- React Router v6
- Tailwind CSS
- Vite
- Axios for API calls
- Lucide React for icons

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running on port 27017
- Check that the MONGODB_URI in your `.env` file is correct
- Verify MongoDB service is started

### Port Already in Use
- Backend runs on port 5000
- Frontend runs on port 5173
- If either port is in use, you can change it in the respective configuration files

### Module Not Found Errors
- Ensure you ran `npm install` in both backend and frontend/vrs directories
- Delete `node_modules` and run `npm install` again if issues persist

## License

ISC
