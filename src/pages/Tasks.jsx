import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreVertical,
    Clock,
    CheckCircle2,
    Trash2,
    Filter,
    AlertCircle,
    Layout
} from 'lucide-react';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import Modal from '../components/Modal';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Pending',
        dueDate: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState(null);

    const fetchInitialData = async () => {
        try {
            const projectsData = await projectService.getProjects();
            setProjects(projectsData);
            if (projectsData.length > 0) {
                setSelectedProjectId(projectsData[0]._id);
                fetchTasks(projectsData[0]._id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            showNotification('error', 'Failed to load projects');
            setLoading(false);
        }
    };

    const fetchTasks = async (projectId) => {
        setLoading(true);
        try {
            const data = await taskService.getTasks(projectId);
            setTasks(data);
        } catch (error) {
            showNotification('error', 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleProjectLink = (id) => {
        setSelectedProjectId(id);
        fetchTasks(id);
    };

    const createTask = async (e) => {
        e.preventDefault();
        if (!selectedProjectId) return showNotification('error', 'Select a project first');

        setSubmitting(true);
        try {
            await taskService.createTask({ ...formData, projectId: selectedProjectId });
            fetchTasks(selectedProjectId);
            setIsModalOpen(false);
            setFormData({ title: '', description: '', priority: 'Medium', status: 'Pending', dueDate: '' });
            showNotification('success', 'Task added');
        } catch (error) {
            showNotification('error', 'Failed to create task');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (task) => {
        const statusMap = { 'Pending': 'In Progress', 'In Progress': 'Completed', 'Completed': 'Pending' };
        try {
            await taskService.updateTask(task._id, { status: statusMap[task.status] });
            fetchTasks(selectedProjectId);
        } catch (error) {
            showNotification('error', 'Update failed');
        }
    };

    const deleteTask = async (id) => {
        try {
            await taskService.deleteTask(id);
            showNotification('success', 'Task deleted');
            fetchTasks(selectedProjectId);
        } catch (error) {
            showNotification('error', 'Delete failed');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
            case 'In Progress': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const filteredTasks = tasks.filter(t => filter === 'All' || t.status === filter);

    if (loading && projects.length === 0) return <div className="flex items-center justify-center h-[50vh]"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-6 text-slate-900 dark:text-slate-100">
            {notification && (
                <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all animate-bounce ${notification.type === 'success' ? 'bg-primary-600 text-white' : 'bg-rose-500 text-white'
                    }`}>
                    <span className="font-bold">{notification.message}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white font-outfit">Tasks</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-inter">Manage project tasks and their execution status.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20 active:scale-95 font-bold"
                >
                    <Plus className="w-5 h-5" /> New Task
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar for Project Selection */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-dark-surface p-5 rounded-3xl border border-slate-200 dark:border-dark-border">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Projects</h3>
                        <div className="space-y-2">
                            {projects.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4 italic">No projects found</p>
                            ) : (
                                projects.map(p => (
                                    <button
                                        key={p._id}
                                        onClick={() => handleProjectLink(p._id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${selectedProjectId === p._id
                                                ? 'bg-primary-600 text-white shadow-md'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        <span className="truncate pr-2">{p.name}</span>
                                        <Layout className={`w-4 h-4 transition-transform ${selectedProjectId === p._id ? 'scale-110' : 'opacity-0 group-hover:opacity-100'}`} />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Task List Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-dark-surface p-4 rounded-3xl border border-slate-200 dark:border-dark-border flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-2">
                            {['All', 'Pending', 'In Progress', 'Completed'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f
                                            ? 'bg-slate-900 dark:bg-primary-600 text-white shadow-lg'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search project tasks..."
                                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all w-64"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="p-20 text-center"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="p-20 text-center">
                                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="font-bold text-slate-400">No tasks found in this project</h3>
                                <p className="text-sm text-slate-300">Click "New Task" to add one.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-dark-border">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Task Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-dark-border/50">
                                    {filteredTasks.map((task) => (
                                        <tr key={task._id} className="hover:bg-slate-50/50 dark:hover:bg-primary-900/5 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleStatus(task)}
                                                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${task.status === 'Completed'
                                                                ? 'bg-emerald-500 border-emerald-500'
                                                                : 'border-slate-300 dark:border-slate-600 hover:border-primary-500'
                                                            }`}
                                                    >
                                                        {task.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                    </button>
                                                    <div>
                                                        <span className={`font-bold block ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                                            {task.title}
                                                        </span>
                                                        {task.dueDate && <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-bold"><Clock className="w-3 h-3" /> Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusColor(task.status)}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-rose-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300">{task.priority}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => deleteTask(task._id)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Task Creation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Task"
            >
                <form onSubmit={createTask} className="space-y-4 font-inter">
                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Task Title</label>
                        <input
                            type="text"
                            required
                            placeholder="E.g. Design Login UI"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-dark-border rounded-xl focus:border-primary-500 transition-all outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Priority</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-dark-border rounded-xl focus:border-primary-500 transition-all outline-none appearance-none"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Due Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-dark-border rounded-xl focus:border-primary-500 transition-all outline-none"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Description</label>
                        <textarea
                            rows="3"
                            placeholder="What needs to be done?"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-dark-border rounded-xl focus:border-primary-500 transition-all outline-none resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98] mt-6"
                    >
                        {submitting ? 'Adding...' : 'Add Task to Project'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Tasks;
