import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    MoreHorizontal,
    CheckCircle2,
    TrendingUp,
    Clock,
    Target,
    Sparkles,
    Layers,
    AlertTriangle,
    Calendar,
    Users
} from 'lucide-react';
import projectService from '../services/projectService';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: '', description: '', status: '' });

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await projectService.deleteProject(id);
                navigate('/projects');
            } catch (error) {
                console.error("Failed to delete project", error);
            }
        }
    };

    const handleUpdate = async () => {
        try {
            const updated = await projectService.updateProject(id, editFormData);
            setProject(updated);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update project", error);
        }
    };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await projectService.getProject(id);
                setProject(data);
            } catch (error) {
                console.error("Failed to load project", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    if (loading) return <div className="p-12 text-center text-slate-500">Loading project details...</div>;
    if (!project) return <div className="p-12 text-center text-rose-500">Project not found</div>;

    const totalPoints = project.aiPlan?.userStories?.reduce((acc, s) => acc + s.points, 0) || 0;
    const totalSprints = Math.ceil(totalPoints / 10) || 4; // Mock velocity of 10
    const tasksCount = 0; // Real tasks would be fetched from taskService

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-bg p-8 font-inter">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <button
                        onClick={() => navigate('/projects')}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-6 font-medium transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Projects
                    </button>

                    <div className="flex justify-between items-start relative">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 font-outfit">{project.name}</h1>
                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-100">
                                    {project.status}
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed text-lg">
                                {project.description}
                            </p>
                            {project.aiPlan?.summary && (
                                <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                    <p className="text-indigo-900 text-sm leading-relaxed">
                                        <span className="font-bold">AI Summary:</span> {project.aiPlan.summary}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <MoreHorizontal className="w-6 h-6" />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setIsEditing(true);
                                            setEditFormData({
                                                name: project.name,
                                                description: project.description,
                                                status: project.status
                                            });
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors"
                                    >
                                        Edit Project
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-medium text-rose-600 transition-colors"
                                    >
                                        Delete Project
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Edit Project</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                    <textarea
                                        value={editFormData.description}
                                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Planning">Planning</option>
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            0%
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Progress</p>
                            <h3 className="text-2xl font-bold text-slate-900">0%</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Tasks Done</p>
                            <h3 className="text-2xl font-bold text-slate-900">0/{project.aiPlan?.userStories?.length || 0}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Story Points</p>
                            <h3 className="text-2xl font-bold text-slate-900">0/{totalPoints}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Sprints</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalSprints}</h3>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200">
                    <div className="flex gap-8">
                        {['overview', 'tasks', 'sprints', 'ai-insights'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === tab
                                    ? 'text-indigo-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab.replace('-', ' ')}
                                {tab === 'tasks' && <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{project.aiPlan?.userStories?.length || 0}</span>}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Key Milestones */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <Layers className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 font-outfit">Project Milestones</h3>
                                </div>
                                <div className="space-y-8 relative pl-2">
                                    <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-slate-100" />
                                    {project.aiPlan?.milestones?.map((milestone, idx) => (
                                        <div key={idx} className="relative pl-10">
                                            <div className="absolute left-0 top-1 w-11 h-11 rounded-full bg-white border-4 border-slate-50 shadow-sm flex items-center justify-center z-10">
                                                <div className="w-3 h-3 rounded-full bg-indigo-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 mb-1">{milestone.title}</h4>
                                                <div className="flex items-center gap-4 text-sm font-medium text-slate-500 mb-2">
                                                    <span className="flex items-center gap-1 text-indigo-600">
                                                        <Calendar className="w-4 h-4" /> {milestone.date}
                                                    </span>
                                                </div>
                                                <p className="text-slate-500">{milestone.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                                <h3 className="text-xl font-bold text-slate-900 font-outfit mb-6">Tech Stack</h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.techStack?.map((tech) => (
                                        <span key={tech} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-medium border border-slate-100 shadow-sm">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            {/* Risk Assessment */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                                        <h3 className="text-lg font-bold text-slate-900">Risk Assessment</h3>
                                    </div>
                                    <span className={`text-2xl font-bold ${project.aiPlan?.riskScore > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {project.aiPlan?.riskScore}/100
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {project.aiPlan?.risks?.map((risk, idx) => (
                                        <div key={idx} className="flex gap-3 items-start">
                                            <div className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${risk.impact === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{risk.risk}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Team */}
                            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-slate-900">Team Members</h3>
                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-xs font-bold">
                                        {project.teamConfig?.length || 0} People
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {project.teamConfig?.map((member, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                                {member.email[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-bold text-slate-900 text-sm truncate">{member.email}</h4>
                                                <p className="text-xs text-slate-500">{member.role}</p>
                                            </div>
                                            {member.skills?.length > 0 && (
                                                <div className="flex -space-x-1">
                                                    {member.skills.slice(0, 2).map((skill, i) => (
                                                        <div key={i} className="w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-white" title={skill} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-6 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:border-slate-300 hover:text-slate-500 transition-all flex items-center justify-center gap-2">
                                    <Users className="w-4 h-4" /> Invite Member
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Project Tasks</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6">
                            Manage tasks visually on the Sprint Board.
                        </p>
                        <button
                            onClick={() => navigate('/sprint-board', { state: { projectId: project._id } })}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            Go to Sprint Board
                        </button>
                    </div>
                )}

                {activeTab === 'sprints' && (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Sprint Planning</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Manage your sprints, velocity, and retrospective data here.
                        </p>
                    </div>
                )}

                {activeTab === 'ai-insights' && (
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
                        <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 font-outfit mb-2">Deep AI Analysis</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Advanced predictive analytics and project optimization suggestions will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;
