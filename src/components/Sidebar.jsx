import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Briefcase,
    CheckSquare,
    Settings,
    Sparkles,
    LogOut,
    Users
} from 'lucide-react';
import analyticsService from '../services/analyticsService';
import taskService from '../services/taskService';
import UserProfileCard from './UserProfileCard';

const Sidebar = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({});
    const [status, setStatus] = useState('online');
    const [currentSprint, setCurrentSprint] = useState('—');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const updateStatus = () => {
            if (!navigator.onLine) return setStatus('offline');
            if (document.visibilityState === 'visible') return setStatus('online');
            setStatus('away');
        };

        const fetchStats = async () => {
            try {
                const data = await analyticsService.getDashboardStats();
                setStats(data.stats || {});
            } catch {
                // ignore failures; stats are optional UI enhancement
            }
        };

        const fetchCurrentSprint = async () => {
            try {
                const tasks = await taskService.getAllTasks();
                const sprintCounts = tasks
                    .map((t) => t.sprint)
                    .filter(Boolean)
                    .reduce((acc, sprint) => {
                        acc[sprint] = (acc[sprint] || 0) + 1;
                        return acc;
                    }, {});

                const mostCommonSprint = Object.entries(sprintCounts).sort((a, b) => b[1] - a[1])[0];
                if (mostCommonSprint) {
                    setCurrentSprint(mostCommonSprint[0]);
                }
            } catch {
                // ignore failures; current sprint is optional
            }
        };

        updateStatus();
        fetchStats();
        fetchCurrentSprint();

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        document.addEventListener('visibilitychange', updateStatus);

        return () => {
            window.removeEventListener('online', updateStatus);
            window.removeEventListener('offline', updateStatus);
            document.removeEventListener('visibilitychange', updateStatus);
        };
    }, []);

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Projects', icon: Briefcase, path: '/projects' },
        { name: 'Sprint Board', icon: CheckSquare, path: '/sprint-board' },
        { name: 'Team Workload', icon: Users, path: '/team-workload' },
        { name: 'AI Insights', icon: Sparkles, path: '/ai-insights' },
    ];

    return (
        <aside className="w-64 h-screen bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border flex flex-col transition-all duration-300 font-inter">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-indigo-900 dark:text-white font-outfit tracking-tight">
                    SmartPM
                </span>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {[
                    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
                    { name: 'Projects', icon: Briefcase, path: '/projects' },
                    { name: 'Sprint Board', icon: CheckSquare, path: '/sprint-board' },
                    { name: 'Team Workload', icon: Users, path: '/team-workload' },
                    { name: 'AI Insights', icon: Sparkles, path: '/ai-insights' },
                ].map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium
              ${isActive
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
            `}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-dark-border">
                <UserProfileCard user={user} stats={stats} currentSprint={currentSprint} status={status} onLogout={handleLogout} />
            </div>
        </aside>
    );
};

export default Sidebar;
