import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Calendar,
    Briefcase,
    LayoutGrid,
    List,
    AlertTriangle,
    ArrowRight,
    Users,
    MoreHorizontal
} from 'lucide-react';
import projectService from '../services/projectService';
import taskService from '../services/taskService';

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const [projectsData, tasksData] = await Promise.all([
                    projectService.getProjects(),
                    taskService.getAllTasks()
                ]);
                setProjects(projectsData);
                setTasks(tasksData);
            } catch (error) {
                console.error("Failed to fetch projects", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

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

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'Planning' && project.status?.toLowerCase() === 'planning') ||
            (activeTab === 'Active' && (project.status?.toLowerCase() === 'active' || project.status?.toLowerCase() === 'in progress')) ||
            (activeTab === 'Completed' && project.status?.toLowerCase() === 'completed');
        return matchesSearch && matchesTab;
    });

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'planning': return 'bg-slate-100 text-slate-600';
            case 'active':
            case 'in progress': return 'bg-indigo-50 text-indigo-600';
            case 'completed': return 'bg-emerald-50 text-emerald-600';
            case 'on hold': return 'bg-amber-50 text-amber-600';
            default: return 'bg-slate-50 text-slate-500';
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 font-inter">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">Projects</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track all your projects</p>
                </div>
                <button
                    onClick={() => navigate('/new-project')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> New Project
                </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-dark-surface p-2 rounded-2xl border border-slate-100 dark:border-dark-border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        {['All', 'Planning', 'Active', 'Completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab
                                        ? 'bg-white dark:bg-dark-bg text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />

                    <div className="flex gap-1 hidden md:flex">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
                <div className="bg-white dark:bg-dark-surface rounded-3xl border-2 border-dashed border-slate-200 dark:border-dark-border p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="text-slate-400 w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 font-outfit text-slate-900 dark:text-white">No projects found</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Try adjusting your search or create a new project.
                    </p>
                </div>
            ) : (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {filteredProjects.map((project) => (
                        <div
                            key={project._id}
                            onClick={() => navigate(`/projects/${project._id}`)}
                            className="bg-white dark:bg-dark-surface rounded-3xl border border-slate-100 dark:border-dark-border p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit line-clamp-1 pr-4">{project.name}</h3>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap ${getStatusStyle(project.status)}`}>
                                    {project.status || 'Planning'}
                                </span>
                            </div>

                            <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-6 font-medium leading-relaxed">
                                {project.description}
                            </p>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Progress</span>
                                    <span className="text-slate-900 dark:text-white">{getProjectProgress(project._id)}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-1000"
                                        style={{ width: `${getProjectProgress(project._id)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-50 dark:border-dark-border flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                                        <Calendar className="w-4 h-4" />
                                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}
                                    </span>
                                    <span className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                                        <Users className="w-4 h-4" />
                                        {getProjectTaskCount(project._id)} tasks
                                    </span>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <ArrowRight className="w-4 h-4 text-slate-900 dark:text-white" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Projects;
