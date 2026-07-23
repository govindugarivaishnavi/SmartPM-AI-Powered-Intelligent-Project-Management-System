# 🚀 Production Deployment Guide

Follow these steps to deploy your AI Project Management application to the cloud.

## 🏗 Prerequisites
1. A GitHub account.
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (Free Tier).
3. A [Render](https://render.com/) account (for Backend).
4. A [Vercel](https://vercel.com/) account (for Frontend).

---

## 1. 🍃 Database Setup (MongoDB Atlas)
1. Log in to MongoDB Atlas and create a new **Shared Cluster** (Free).
2. Go to **Network Access** -> **Add IP Address** -> Select **Allow Access From Anywhere** (or specifically add Render's outbound IPs later).
3. Go to **Database Access** -> **Add New Database User**. Create a user with a secure password.
4. Go to **Clusters** -> **Connect** -> **Connect your application**.
5. Copy the connection string. It should look like this:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
6. Replace `<password>` with your actual password. **Keep this string ready.**

---

## 2. ⚡ Backend Deployment (Render)
1. Push your code to a GitHub repository.
2. Log in to Render and click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service:
   - **Name**: `ai-project-manager-api`
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node server.js`
5. Click **Advanced** and add the following **Environment Variables**:
   - `PORT`: `10000` (or leave default)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: (Your MongoDB Atlas connection string)
   - `JWT_SECRET`: (Generate a long random string)
   - `OPENAI_API_KEY`: (Your official OpenAI API Key)
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app` (You'll update this after deploying frontend)
6. Click **Create Web Service**.

---

## 3. 🌐 Frontend Deployment (Vercel)
1. Log in to Vercel and click **Add New** -> **Project**.
2. Connect your GitHub repository.
3. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api`
5. Click **Deploy**.

---

## 4. 🔗 Final Linkage
1. Once the frontend is deployed, copy its URL.
2. Go back to your **Render Backend Dashbord** -> **Environment**.
3. Update `CLIENT_URL` with your new Vercel URL.
4. Redeploy the backend if necessary.

---

## ✅ Post-Deployment Checklist
- [ ] **Health Check**: Visit `https://your-backend.render.com/health` to confirm the API is alive.
- [ ] **Auth Flow**: Register a new account and log in.
- [ ] **AI Test**: Ask the AI assistant to generate a project idea to verify OpenAI integration.
- [ ] **Analytics**: Create 2-3 projects and tasks to see the dashboard charts populate.
- [ ] **SEO**: Ensure meta tags are working (inspect the page source on Vercel).

## 🛡 Security Notes
- Never commit your `.env` file to GitHub.
- Use **Vercel Data Cache** for better performance if needed.
- Monitor your **OpenAI usage** in their dashboard to prevent unexpected costs.
