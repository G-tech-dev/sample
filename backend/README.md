# Backend Project

This backend stores HR users, posts, and candidates in MongoDB and uses session-based auth backed by MongoDB.

## Setup

1. Make sure MongoDB is running locally at `mongodb://127.0.0.1:27017` or set `MONGO_URI` in `.env`.
2. Install dependencies:

```bash
cd BACKEND-PROJECT
npm install
```

3. Start the backend:

```bash
npm start
```

The API is available at `http://localhost:4000/api`.

## Notes

- Data is saved in MongoDB using Mongoose.
- Sessions are persisted with `connect-mongo`.
- Use the React frontend at `FRONTEND-PROJECT/cafe-camellia`.
