# 🚀 AI-Powered Project Management Platform

A modern, full-stack SaaS application for intelligent project management.

## ✨ Features
- **Intelligent Dashboard**: Real-time analytics with productivity charts (Recharts).
- **AI Specialist**: Project idea generation and task breakdowns powered by OpenAI.
- **Project Management**: Full CRUD operations for projects with categories and status tracking.
- **Task Portal**: Project-specific task management with status toggling.
- **Security**: JWT-based authentication and protected routes.
- **Premium UI**: Clean, responsive design with Dark/Light mode support (Tailwind CSS + Framer Motion).

## 🛠 Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Recharts, Axios.
- **Backend**: Node.js, Express, MongoDB, Mongoose, OpenAI SDK.
- **Deployment**: Render (Backend), Vercel (Frontend), MongoDB Atlas (Database).

## 🚀 Quick Start (Local)

### 1. Backend Setup
1. Navigate to the `server` directory.
2. Create a `.env` file with:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_key
   ```
3. Run `npm install` and `npm run dev`.

### 2. Frontend Setup
1. Navigate to the `client` directory.
2. Create a `.env` file with:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Run `npm install` and `npm run dev`.

## 🌐 Production Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for full cloud hosting instructions.

## 📄 License
MIT
