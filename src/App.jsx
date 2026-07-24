import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import AIAssistant from './pages/AIAssistant';
import Settings from './pages/Settings';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NewProject from './pages/NewProject';
import ProjectDetails from './pages/ProjectDetails';
import SprintBoard from './pages/SprintBoard';
import TeamWorkload from './pages/TeamWorkload';
import AIInsights from './pages/AIInsights';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route element={<PublicRoute />}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/verify-email/:token" element={<VerifyEmail />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />
                        </Route>

                        <Route element={<PrivateRoute />}>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<Dashboard />} />
                                <Route path="new-project" element={<NewProject />} />
                                <Route path="projects" element={<Projects />} />
                                <Route path="projects/:id" element={<ProjectDetails />} />
                                <Route path="sprint-board" element={<SprintBoard />} />
                                <Route path="team-workload" element={<TeamWorkload />} />
                                <Route path="ai-insights" element={<AIInsights />} />
                                <Route path="tasks" element={<Tasks />} />
                                <Route path="ai" element={<AIAssistant />} />
                                <Route path="settings" element={<Settings />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
