import React, { useState, useEffect, useMemo } from 'react';
import {
    Briefcase,
    CheckCircle2,
    Zap,
    TrendingUp,
    Plus,
    ArrowRight,
    MoreVertical,
    AlertTriangle,
    Lightbulb,
    Layout,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import analyticsService from '../services/analyticsService';
import projectService from '../services/projectService';
import taskService from '../services/taskService';

const StatCard = ({ title, value, subtext, icon: Icon, color, iconBg }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"
    >
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-slate-900 font-outfit">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${iconBg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
        <p className={`text-xs font-semibold ${subtext.includes('planned') ? 'text-slate-400' : 'text-emerald-600'}`}>
            {subtext}
        </p>
    </motion.div>
);

const ProjectRow = ({ project, progress, taskCount }) => {
    const status = project.status || 'in progress';
    const progressValue = progress ?? 0;
    const taskCountValue = taskCount ?? 0;

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all mb-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{project.name}</h4>
                    <p className="text-slate-500 text-sm line-clamp-2">{project.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'in progress' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {status}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-900">{progressValue}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-1000"
                        style={{ width: `${progressValue}%` }}
                    />
                </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                            U{i}
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-400">
                        +2
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                    <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        May 15
                    </div>
                    <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {taskCountValue} tasks
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
            </div>
        </div>
    );
};

const InsightCard = ({ type, title, desc }) => {
    const styles = {
        success: { border: 'border-l-4 border-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2, iconColor: 'text-emerald-500' },
        info: { border: 'border-l-4 border-indigo-500', bg: 'bg-indigo-50', icon: Lightbulb, iconColor: 'text-indigo-500' },
        warning: { border: 'border-l-4 border-rose-500', bg: 'bg-rose-50', icon: AlertTriangle, iconColor: 'text-rose-500' }
    };

    const style = styles[type] || styles.info;
    const Icon = style.icon;

    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 ${style.border} flex gap-4`}>
            <div className={`p-2 rounded-lg h-fit ${style.bg}`}>
                <Icon className={`w-5 h-5 ${style.iconColor}`} />
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeProjects: 0,
        completedTasks: 0,
        totalTasks: 0,
        activeSprints: 0,
        storyPoints: 0,
        totalStoryPoints: 0
    });
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);

    const projectTaskStats = useMemo(() => {
        const stats = {};

        tasks.forEach(task => {
            const projectId = task.project?._id || task.project;
            if (!projectId) return;

            if (!stats[projectId]) {
                stats[projectId] = { total: 0, completed: 0 };
            }

            stats[projectId].total += 1;
            if (['Done', 'Completed'].includes(task.status)) {
                stats[projectId].completed += 1;
            }
        });

        return stats;
    }, [tasks]);

    const getProjectProgress = (projectId) => {
        const stats = projectTaskStats[projectId];
        if (!stats || stats.total === 0) return 0;
        return Math.round((stats.completed / stats.total) * 100);
    };

    const getProjectTaskCount = (projectId) => projectTaskStats[projectId]?.total || 0;

    useEffect(() => {
        const loadToData = async () => {
            try {
                const [statsData, projectsData, tasksData] = await Promise.all([
                    analyticsService.getDashboardStats(),
                    projectService.getProjects(),
                    taskService.getAllTasks()
                ]);

                setStats({
                    activeProjects: statsData.stats.totalProjects || 0,
                    completedTasks: statsData.stats.completedTasks || 0,
                    totalTasks: statsData.stats.totalTasks || 0,
                    activeSprints: statsData.stats.activeSprints || 0,
                    storyPoints: statsData.stats.storyPoints || 0,
                    totalStoryPoints: statsData.stats.totalStoryPoints || 0
                });
                setProjects(projectsData.slice(0, 3)); // Top 3
                setTasks(tasksData);
            } catch (error) {
                console.error("Error loading dashboard", error);
            } finally {
                setLoading(false);
            }
        };
        loadToData();
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 font-inter">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 font-outfit tracking-tight mb-2">Welcome back</h1>
                    <p className="text-slate-500 font-medium">Here's what's happening with your projects today</p>
                </div>
                <button
                    onClick={() => navigate('/new-project')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Project
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Projects"
                    value={stats.activeProjects}
                    subtext={`${stats.activeProjects} projects active`}
                    icon={Briefcase}
                    color="text-indigo-600"
                    iconBg="bg-indigo-50"
                />
                <StatCard
                    title="Tasks Completed"
                    value={stats.completedTasks}
                    subtext={`${stats.totalTasks} tasks in total`}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
                <StatCard
                    title="Active Sprints"
                    value={stats.activeSprints}
                    subtext={`${stats.activeSprints} sprints tracked`}
                    icon={Zap}
                    color="text-amber-600"
                    iconBg="bg-amber-50"
                />
                <StatCard
                    title="Story Points"
                    value={stats.storyPoints}
                    subtext={`of ${stats.totalStoryPoints} total points`}
                    icon={TrendingUp}
                    color="text-violet-600"
                    iconBg="bg-violet-50"
                />
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold font-outfit mb-2">SmartPM</h2>
                            <p className="text-indigo-100 text-lg">A modern AI-powered project manager to help teams plan, track, and deliver work faster.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Projects */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900 font-outfit">Recent Projects</h3>
                        <button onClick={() => navigate('/projects')} className="text-indigo-600 font-bold text-sm hover:underline">View all &rarr;</button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Loading projects...</div>
                    ) : projects.length > 0 ? (
                        projects.map(p => (
                            <ProjectRow
                                key={p._id}
                                project={p}
                                progress={getProjectProgress(p._id)}
                                taskCount={getProjectTaskCount(p._id)}
                            />
                        ))
                    ) : (
                        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
                            <p className="text-slate-500">No projects yet. Create one to get started!</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Quick Actions & Insights List */}
                <div className="space-y-8">
                    {/* Quick Actions */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 font-outfit mb-6">Quick Actions</h3>
                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/new-project')}
                                className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group"
                            >
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Layout className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">AI Project Generator</h4>
                                    <p className="text-xs text-slate-500">Describe & auto-generate</p>
                                </div>
                            </button>
                            <button
                                onClick={() => navigate('/sprint-board')}
                                className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group"
                            >
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Sprint Board</h4>
                                    <p className="text-xs text-slate-500">Manage tasks visually</p>
                                </div>
                            </button>
                            <button
                                onClick={() => navigate('/team-workload')}
                                className="w-full bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 text-left group"
                            >
                                <div className="p-3 bg-violet-50 text-violet-600 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Team Workload</h4>
                                    <p className="text-xs text-slate-500">Balance assignments</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* AI Insights List */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-xl font-bold text-slate-900 font-outfit">AI Insights</h3>
                        </div>
                        <div className="space-y-4">
                            {stats.totalTasks > 0 ? (
                                <>
                                    <InsightCard
                                        type="success"
                                        title="Active Implementation"
                                        desc={`You have ${stats.totalTasks} tasks tracked across your projects.`}
                                    />
                                    {stats.completedTasks > 0 && (
                                        <InsightCard
                                            type="info"
                                            title="Completion Progress"
                                            desc={`Currently ${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% of your planned work is done.`}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Insights Yet</p>
                                    <p className="text-[10px] text-slate-400 mt-2">Create a project to see AI analysis</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
