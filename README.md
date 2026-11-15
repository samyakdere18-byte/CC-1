# Student Management System

A locally run student directory with a React/Vite frontend, an Express API, and MongoDB.

## Run locally

Requirements: Node.js and npm. MongoDB can run locally or through a MongoDB Atlas connection string.

1. Configure `backend/.env` with the database URI. For a local MongoDB server, use:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/student_management
   FRONTEND_URL=http://localhost:5173
   ```

   For Atlas, put your connection string in `MONGODB_URI` instead.

2. In one terminal, start the backend:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

3. In a second terminal, start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite (normally `http://localhost:5173`). The API runs at `http://localhost:5000`; check `http://localhost:5000/api/health` for database status.

The frontend uses the local API by default. To override it, set `VITE_API_URL` in `frontend/.env` (for example, `http://localhost:5000/api`).

## Features

- Create, view, update, and delete students
- Search by student ID or name
- Validation for required fields, email, semester (1–12), and duplicate student IDs
- MCP tools for managing student records when `MCP_SECRET` is configured in `backend/.env`

The local MCP endpoint is `http://localhost:5000/mcp/<MCP_SECRET>`.

## Deployments

- Frontend (Netlify): [https://cc-1121.netlify.app](https://cc-1121.netlify.app)
- Backend API (Render): [https://cc-1-n9al.onrender.com](https://cc-1-n9al.onrender.com)
- Backend health: [https://cc-1-n9al.onrender.com/api/health](https://cc-1-n9al.onrender.com/api/health)

The frontend uses the local API while running in Vite development and the Render API in production. Production builds ignore localhost `VITE_API_URL` values. Netlify builds the `frontend` directory. Configure the Render service with `backend` as its root, `npm install` as its build command, and `npm start` as its start command. Set `MONGODB_URI` and `FRONTEND_URL=https://cc-1121.netlify.app` in Render. Set `VITE_API_URL=https://cc-1-n9al.onrender.com/api` in Netlify if overriding the production default.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | List students |
| GET | `/api/students/:id` | Get one student |
| POST | `/api/students` | Create student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
