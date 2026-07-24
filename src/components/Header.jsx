import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Sun, Moon, Briefcase, CheckCircle, Brain, X, Loader2, Info, Clock, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import notificationService from '../services/notificationService';

const Header = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState({ projects: [], tasks: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const searchRef = useRef(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await notificationService.getNotifications();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (searchQuery.trim().length < 2) {
                setResults({ projects: [], tasks: [] });
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            setShowResults(true);
            try {
                const [allProjects, allTasks] = await Promise.all([
                    projectService.getProjects(),
                    taskService.getAllTasks()
                ]);

                const filteredProjects = allProjects.filter(p =>
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                const filteredTasks = allTasks.filter(t =>
                    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                setResults({
                    projects: filteredProjects.slice(0, 5),
                    tasks: filteredTasks.slice(0, 5)
                });
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleResultClick = (type, id) => {
        if (type === 'project') {
            navigate(`/projects/${id}`);
        } else if (type === 'task') {
            navigate('/tasks');
        }
        setShowResults(false);
        setSearchQuery('');
    };

    const handleMarkRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleClearAll = async () => {
        try {
            await notificationService.clearNotifications();
            setNotifications([]);
            setUnreadCount(0);
            setShowNotifications(false);
        } catch (error) {
            console.error("Failed to clear notifications", error);
        }
    };

    return (
        <header className="h-16 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border sticky top-0 z-10 px-8 flex items-center justify-between">
            <div className="flex-1 max-w-xl relative" ref={searchRef}>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search projects, tasks, or AI insights..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchQuery.trim() && setShowResults(true)}
                        className="w-full pl-10 pr-10 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setShowResults(false); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3 text-slate-500" />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown remains same... */}
                {showResults && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {isSearching ? (
                            <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                <span className="text-xs font-medium">Searching workspace...</span>
                            </div>
                        ) : (
                            <div className="max-h-[400px] overflow-y-auto p-2">
                                {results.projects.length === 0 && results.tasks.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">No matches found for "{searchQuery}"</p>
                                    </div>
                                ) : (
                                    <>
                                        {results.projects.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                                    <Brain className="w-3 h-3" /> Projects
                                                </h3>
                                                {results.projects.map(project => (
                                                    <button
                                                        key={project._id}
                                                        onClick={() => handleResultClick('project', project._id)}
                                                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                            <Briefcase className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{project.name}</p>
                                                            <p className="text-[10px] text-slate-500 line-clamp-1">{project.category || 'General'}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {results.tasks.length > 0 && (
                                            <div>
                                                <h3 className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                                    <CheckCircle className="w-3 h-3" /> Tasks
                                                </h3>
                                                {results.tasks.map(task => (
                                                    <button
                                                        key={task._id}
                                                        onClick={() => handleResultClick('task', task._id)}
                                                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{task.title}</p>
                                                            <p className="text-[10px] text-slate-500 line-clamp-1">{task.status}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Notifications Bell */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-dark-surface text-[8px] text-white flex items-center justify-center font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
                                <button
                                    onClick={handleClearAll}
                                    className="text-[10px] font-bold text-primary-500 hover:text-primary-600 uppercase tracking-wider"
                                >
                                    Clear All
                                </button>
                            </div>

                            <div className="max-h-[350px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                            <Bell className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">All caught up!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-dark-border">
                                        {notifications.map(notif => (
                                            <div
                                                key={notif._id}
                                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${!notif.read ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                                            notif.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                                notif.type === 'error' ? 'bg-rose-100 text-rose-600' :
                                                                    'bg-primary-100 text-primary-600'
                                                        }`}>
                                                        {notif.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{notif.title}</p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{notif.message}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Clock className="w-3 h-3 text-slate-400" />
                                                            <span className="text-[10px] text-slate-400 font-medium">Recently</span>
                                                        </div>
                                                    </div>
                                                    {!notif.read && (
                                                        <button
                                                            onClick={() => handleMarkRead(notif._id)}
                                                            className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-dark-border text-center">
                                <button className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">View All Updates</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
