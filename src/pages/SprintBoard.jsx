import React, { useState, useEffect } from 'react';
import {
    Plus,
    MoreHorizontal,
    Calendar,
    Filter,
    ChevronDown,
    Search,
    Wand2,
    Users,
    CalendarClock
} from 'lucide-react';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import workloadService from '../services/workloadService';
import { generateProjectReportPdf } from '../utils/reportGenerator';
import Modal from '../components/Modal';

import { useLocation } from 'react-router-dom';
// ... other imports

const SprintBoard = () => {
    const location = useLocation();
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedProject, setSelectedProject] = useState(location.state?.projectId || 'All Projects');
    const [selectedSprint, setSelectedSprint] = useState('All Sprints');
    const [reportLoading, setReportLoading] = useState(false);

    // Drag & Drop
    const [draggedTask, setDraggedTask] = useState(null);

    // Modal for creating/editing
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskStatus, setNewTaskStatus] = useState('To Do');
    const [projectMembers, setProjectMembers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: '',
        priority: 'Medium',
        points: 0,
        type: 'Story',
        sprint: 'Sprint 1',
        tags: '',
        skills: '',
        dueDate: '',
        assignedTo: ''
    });

    // State for viewing details
    const [selectedTask, setSelectedTask] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const columns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterTasks();
    }, [tasks, selectedProject, selectedSprint]);

    useEffect(() => {
        if (formData.projectId) {
            const project = projects.find(p => p._id === formData.projectId);
            if (project) {
                // If the project has populated members use them, otherwise use teamConfig for reference
                // For simplicity in this common pattern, we'll use the team emails to identify potential assignees
                // In a real app we'd fetch the User objects
                const members = project.teamConfig || [];
                setProjectMembers(members);
            }
        } else {
            setProjectMembers([]);
        }
    }, [formData.projectId, projects]);

    const fetchData = async () => {
        try {
            const [projectsData, tasksData] = await Promise.all([
                projectService.getProjects(),
                taskService.getAllTasks()
            ]);
            setProjects(projectsData);
            setTasks(tasksData);

            // If redirected with a project ID, ensure its data is available
            if (location.state?.projectId) {
                setSelectedProject(location.state.projectId);
            }
        } catch (error) {
            console.error("Failed to fetch board data", error);
        } finally {
            setLoading(false);
        }
    };

    const filterTasks = () => {
        let filtered = [...tasks];

        if (selectedProject !== 'All Projects') {
            filtered = filtered.filter(t => {
                const projectId = t.project?._id || t.project;
                return projectId && projectId.toString() === selectedProject;
            });
        }

        if (selectedSprint !== 'All Sprints') {
            filtered = filtered.filter(t => t.sprint === selectedSprint);
        }

        setFilteredTasks(filtered);
    };

    const handleDragStart = (e, task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, status) => {
        e.preventDefault();
        if (!draggedTask) return;

        if (draggedTask.status === status) return;

        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t._id === draggedTask._id ? { ...t, status } : t
        );
        setTasks(updatedTasks);
        setDraggedTask(null);

        try {
            await taskService.updateTask(draggedTask._id, { status });
        } catch (error) {
            console.error("Failed to update task status", error);
            fetchData();
        }
    };

    const openAddTaskModal = (status = 'To Do') => {
        setNewTaskStatus(status);
        const defaultProject = selectedProject !== 'All Projects' ? selectedProject : (projects[0]?._id || '');
        setFormData({
            title: '',
            description: '',
            projectId: defaultProject,
            priority: 'Medium',
            points: 1,
            type: 'Story',
            sprint: 'Sprint 1',
            tags: 'user story',
            skills: '',
            dueDate: '',
            assignedTo: ''
        });
        setIsModalOpen(true);
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await taskService.createTask({
                ...formData,
                status: newTaskStatus,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : []
            });
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to create task", error);
        }
    };

    const handleDownloadReport = async () => {
        if (selectedProject === 'All Projects') {
            return alert('Select a project first to generate a report.');
        }

        const project = projects.find(p => p._id === selectedProject);
        if (!project) {
            return alert('Selected project data is not available yet.');
        }

        setReportLoading(true);
        try {
            const workload = await workloadService.getWorkload();
            const projectTasks = tasks.filter(t => {
                const projectId = t.project?._id || t.project;
                return projectId && projectId.toString() === selectedProject;
            });
            await generateProjectReportPdf({ project, tasks: projectTasks, workload });
        } catch (error) {
            console.error('Failed to generate report', error);
            alert('Failed to generate report. See console for details.');
        } finally {
            setReportLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-rose-100 text-rose-700';
            case 'critical': return 'bg-rose-600 text-white';
            case 'medium': return 'bg-indigo-100 text-indigo-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'bug': return 'text-rose-500 bg-rose-50';
            default: return 'text-violet-600 bg-violet-50';
        }
    };

    if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div></div>;

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col font-inter">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-outfit">Sprint Board</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track your project tasks visually</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="appearance-none bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        >
                            <option value="All Projects">All Projects</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={selectedSprint}
                            onChange={(e) => setSelectedSprint(e.target.value)}
                            className="appearance-none bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl px-4 py-2.5 pr-10 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        >
                            <option value="All Sprints">All Sprints</option>
                            <option value="Sprint 1">Sprint 1</option>
                            <option value="Sprint 2">Sprint 2</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                        onClick={() => openAddTaskModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Create Task
                    </button>
                    <button
                        onClick={handleDownloadReport}
                        disabled={reportLoading}
                        className="bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {reportLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-indigo-600 rounded-full animate-spin border-t-transparent" />
                                Generating...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Wand2 className="w-5 h-5" /> Download Report
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-6 h-full min-w-[1250px]">
                    {columns.map(column => {
                        const columnTasks = filteredTasks.filter(t => t.status === column);

                        return (
                            <div
                                key={column}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column)}
                                className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 min-w-[280px]"
                            >
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${column === 'Backlog' ? 'bg-slate-400' :
                                                column === 'To Do' ? 'bg-indigo-400' :
                                                    column === 'In Progress' ? 'bg-amber-400' :
                                                        column === 'Review' ? 'bg-violet-400' : 'bg-emerald-400'
                                            }`} />
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">{column}</h3>
                                    </div>
                                    <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-lg text-xs font-bold text-slate-500 shadow-sm">
                                        {columnTasks.length}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {columnTasks.map(task => (
                                        <div
                                            key={task._id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task)}
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setIsDetailsOpen(true);
                                            }}
                                            className="bg-white dark:bg-dark-surface p-4 rounded-xl border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-md transition-all cursor-grab cursor-pointer active:cursor-grabbing group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getTypeColor(task.type)}`}>
                                                    {task.type || 'Story'}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">{task.points || 0} pts</span>
                                            </div>

                                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{task.title}</h4>

                                            <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                                {task.description}
                                            </p>

                                            <div className="flex justify-between items-end">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {task.project && (
                                                        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[80px]">
                                                            {(task.project.name || '').toUpperCase()}
                                                        </span>
                                                    )}
                                                    <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-extrabold text-indigo-600 ring-2 ring-white shadow-sm" title={task.assignedTo?.email || 'Unassigned'}>
                                                        {(task.assignedTo?.username || task.assignedTo?.email || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {columnTasks.length === 0 && (
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center opacity-50">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Tasks</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => openAddTaskModal(column)}
                                    className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-xs font-bold border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
                                >
                                    <Plus className="w-4 h-4" /> Add Task
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Task Details Modal */}
            {selectedTask && (
                <Modal
                    isOpen={isDetailsOpen}
                    onClose={() => setIsDetailsOpen(false)}
                    title={selectedTask.title}
                    maxWidth="max-w-lg"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            {selectedTask.description || 'No description provided.'}
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <span className="font-bold">Type:</span> {selectedTask.type || 'Story'}
                            </div>
                            <div>
                                <span className="font-bold">Priority:</span> {selectedTask.priority}
                            </div>
                            <div>
                                <span className="font-bold">Points:</span> {selectedTask.points || 0}
                            </div>
                            <div>
                                <span className="font-bold">Sprint:</span> {selectedTask.sprint}
                            </div>
                            <div className="col-span-2">
                                <span className="font-bold">Project:</span> {selectedTask.project?.name || '—'}
                            </div>
                            <div className="col-span-2">
                                <span className="font-bold">Assigned to:</span> {selectedTask.assignedTo?.email || 'Unassigned'}
                            </div>
                            {selectedTask.dueDate && (
                                <div className="col-span-2">
                                    <span className="font-bold">Due:</span> {new Date(selectedTask.dueDate).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Add Task Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Task"
                maxWidth="max-w-2xl"
                headerRight={
                    <button type="button" className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800">
                        <Wand2 className="w-3.5 h-3.5" /> AI Assist
                    </button>
                }
            >
                <form onSubmit={handleCreateTask} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Title *</label>
                        <input
                            required
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400 font-medium"
                            placeholder="e.g., Implement secure login"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Description</label>
                        <textarea
                            rows="3"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none dark:text-white placeholder:text-slate-400 font-medium"
                            placeholder="What needs to be done?"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Project *</label>
                            <div className="relative">
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none dark:text-white font-medium shadow-sm"
                                    value={formData.projectId}
                                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                >
                                    <option value="">Select project</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Sprint</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none dark:text-white font-medium shadow-sm"
                                    value={formData.sprint}
                                    onChange={e => setFormData({ ...formData, sprint: e.target.value })}
                                >
                                    <option value="Sprint 1">Sprint 1</option>
                                    <option value="Sprint 2">Sprint 2</option>
                                    <option value="Sprint 3">Sprint 3</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Type</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none dark:text-white font-medium"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Task">Task</option>
                                    <option value="Story">Story</option>
                                    <option value="Bug">Bug</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Priority</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none dark:text-white font-medium"
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Points</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium appearance-none"
                                value={formData.points}
                                onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })}
                            >
                                {[1, 2, 3, 5, 8, 13].map(p => <option key={p} value={p}>{p} pts</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Assignee</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none dark:text-white font-medium"
                                    value={formData.assignedTo}
                                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                                >
                                    <option value="">Select teammate</option>
                                    {projectMembers.map((member, idx) => (
                                        <option key={idx} value={member.email}>{member.email} ({member.role})</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Due Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-dark-border mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SprintBoard;
