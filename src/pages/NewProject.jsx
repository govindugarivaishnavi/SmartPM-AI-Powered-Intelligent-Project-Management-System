import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Calendar,
    Users,
    CheckCircle2,
    AlertTriangle,
    Target,
    Layers,
    Code2,
    Save
} from 'lucide-react';
import aiService from '../services/aiService';
import projectService from '../services/projectService';

const StepIndicator = ({ currentStep }) => (
    <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                    ${step === currentStep ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' :
                        step < currentStep ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}
                `}>
                    {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                    <div className={`w-12 h-1 rounded-full mx-2 ${step < currentStep ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                )}
            </div>
        ))}
    </div>
);

const NewProject = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'Startup MVP',
        startDate: '',
        endDate: '',
        techStack: [],
        teamSize: 1,
        teamMembers: [],
        newMemberEmail: '',
        newSkill: ''
    });
    const [aiPlan, setAiPlan] = useState(null);

    const techOptions = [
        'React', 'Python', 'Node.js', '.NET', 'TypeScript', 'MongoDB',
        'PostgreSQL', 'AWS', 'Azure', 'Docker', 'GraphQL', 'REST API',
        'Machine Learning', 'TensorFlow', 'OpenAI', 'Firebase'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleTech = (tech) => {
        setFormData(prev => ({
            ...prev,
            techStack: prev.techStack.includes(tech)
                ? prev.techStack.filter(t => t !== tech)
                : [...prev.techStack, tech]
        }));
    };

    const addTeamMember = async () => {
        if (formData.newMemberEmail) {
            // Extract the first part of the skill value as role, or keep it as is if it's one word
            const roleInput = formData.newSkill || 'Member';
            const emailToSend = formData.newMemberEmail;

            setFormData(prev => ({
                ...prev,
                teamMembers: [...prev.teamMembers, {
                    email: emailToSend,
                    role: roleInput,
                    skills: prev.newSkill ? prev.newSkill.split(',').map(s => s.trim()) : []
                }],
                newMemberEmail: '',
                newSkill: ''
            }));

            // TRIGGER DYNAMIC EMAIL SENDING
            try {
                const projectService = (await import('../services/projectService')).default;
                await projectService.inviteMember({
                    email: emailToSend,
                    role: roleInput,
                    projectName: formData.name || 'AI Managed Project'
                });
                console.log(`Invitation sent to ${emailToSend}`);
            } catch (error) {
                console.error("Failed to send invitation email", error);
            }
        }
    };

    const generateProjectPlan = async () => {
        setLoading(true);
        try {
            const prompt = `
                I want to create a high-quality, professional software project plan.
                Project Name: ${formData.name}
                Description: ${formData.description}
                Target Category/Type: ${formData.type}
                Technical Stack: ${formData.techStack.join(', ')}
                Team Size: ${formData.teamSize}

                As a Senior Product Manager, generate a detailed roadmap. 
                Focus on specialized features. For example, if it's an AI Career Assistant, include features like 'AI Mock Interviewer', 'Real-time Resume Feedback', 'Career Path Predictor', and 'Skill Gap Analyzer'.
                
                The response MUST be a valid JSON object.
            `;

            const responseData = await aiService.generateAIContent(prompt, 'project_plan');
            console.log("AI Raw Response:", responseData);

            let planData;
            // The backend returns { success: true, data: { ...plan } }
            const rawPlan = responseData.data;

            if (typeof rawPlan === 'string') {
                try {
                    const cleanJson = rawPlan.replace(/```json|```/g, '').trim();
                    planData = JSON.parse(cleanJson);
                } catch (e) {
                    console.error("Failed to parse AI JSON string", e);
                    throw new Error("AI returned invalid data format");
                }
            } else {
                planData = rawPlan;
            }

            console.log("Extracted Plan Data:", planData);
            setAiPlan(planData);
            setStep(3);
        } catch (error) {
            console.error("AI Generation failed", error);
            const errorMsg = error.response?.data?.message || error.message;
            const detail = error.response?.data?.error || "";
            alert(`AI Generation failed: ${errorMsg}${detail ? ` (${detail})` : ""}. \n\nNote: If you see 'insufficient_quota', you need to add credits to your OpenAI account.`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProject = async () => {
        try {
            const res = await projectService.createProject({
                name: formData.name,
                description: formData.description,
                status: 'Planning',
                startDate: formData.startDate,
                endDate: formData.endDate,
                techStack: formData.techStack,
                teamConfig: formData.teamMembers,
                aiPlan: aiPlan
            });
            navigate('/sprint-board', { state: { projectId: res._id } });
        } catch (error) {
            console.error("Failed to save project", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-bg p-8 font-inter">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-2 mb-4 font-medium transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-outfit">Create Project</h1>
                            <p className="text-slate-500 dark:text-slate-400">Describe your project and let AI help generate the plan</p>
                        </div>
                    </div>
                </div>

                <StepIndicator currentStep={step} />

                {/* Content Card */}
                <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-dark-border overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-8 space-y-6"
                            >
                                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
                                    <Target className="w-5 h-5" />
                                    <span>Project Details</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Project Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="e.g., AI Powered Task Manager"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Project Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Describe your project goals, key features, target users, and any specific requirements..."
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Project Type</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {['Hackathon', 'Startup MVP', 'Enterprise'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setFormData({ ...formData, type })}
                                                    className={`py-3 rounded-xl font-medium border transition-all ${formData.type === type
                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                    >
                                        Continue <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-8 space-y-6"
                            >
                                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
                                    <Code2 className="w-5 h-5" />
                                    <span>Technology & Team</span>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Tech Stack (select all that apply)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {techOptions.map(tech => (
                                                <button
                                                    key={tech}
                                                    onClick={() => toggleTech(tech)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.techStack.includes(tech)
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {tech}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Team Size</label>
                                        <input
                                            type="number"
                                            name="teamSize"
                                            value={formData.teamSize}
                                            onChange={handleInputChange}
                                            min="1"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Team Members</label>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    name="newMemberEmail"
                                                    value={formData.newMemberEmail}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter email address"
                                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    name="newSkill"
                                                    value={formData.newSkill}
                                                    onChange={handleInputChange}
                                                    placeholder="Role / Skills (e.g. React, Design)"
                                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={addTeamMember}
                                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                                            >
                                                Add Team Member
                                            </button>
                                        </div>
                                        {formData.teamMembers.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {formData.teamMembers.map((member, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium border border-indigo-100 w-full">
                                                        <Users className="w-4 h-4 text-indigo-500" />
                                                        <span className="font-bold">{member.email}</span>
                                                        {member.skills && member.skills.length > 0 && (
                                                            <span className="text-indigo-400 text-xs ml-auto">
                                                                {member.skills.join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between pt-8">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-slate-500 font-bold hover:text-slate-800 px-6 py-3 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={generateProjectPlan}
                                        disabled={loading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Sparkles className="w-5 h-5 animate-spin" /> Generating Plan...
                                            </>
                                        ) : (
                                            <>
                                                Generate Plan <Sparkles className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && aiPlan && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-8 space-y-8"
                            >
                                {/* AI Summary Banner */}
                                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold font-outfit mb-2">AI-Generated Project Plan</h2>
                                            <p className="text-indigo-100 leading-relaxed text-sm opacity-90">{aiPlan.summary}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Milestones */}
                                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Layers className="w-5 h-5 text-indigo-600" />
                                            <h3 className="font-bold text-slate-900 text-lg">Milestones</h3>
                                        </div>
                                        <div className="space-y-6 relative pl-2">
                                            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-100" />
                                            {(aiPlan.milestones || []).map((milestone, idx) => (
                                                <div key={idx} className="relative pl-8">
                                                    <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-indigo-100 border-2 border-indigo-600 z-10 text-[10px] flex items-center justify-center font-bold text-indigo-600">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{milestone.title || "Unnamed Milestone"}</h4>
                                                        <p className="text-xs text-indigo-600 font-bold mb-1">{milestone.date || "TBD"}</p>
                                                        <p className="text-sm text-slate-500">{milestone.description || "No description provided."}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Risk Assessment */}
                                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                                                <h3 className="font-bold text-slate-900 text-lg">Risk Assessment</h3>
                                            </div>
                                            <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                                                Score: <span className={(aiPlan.riskScore || 0) > 80 ? 'text-emerald-500' : 'text-amber-500'}>{aiPlan.riskScore || 0}/100</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {(aiPlan.risks || []).map((risk, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className={`mt-1 w-2 h-2 rounded-full ${risk.impact === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                    <p className="text-sm text-slate-600 font-medium">{risk.risk || "Unnamed Risk"}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Generated User Stories */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target className="w-5 h-5 text-emerald-600" />
                                        <h3 className="font-bold text-slate-900 text-lg">Generated User Stories ({(aiPlan.userStories || []).length})</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(aiPlan.userStories || []).map((story, idx) => (
                                            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${story.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                                                        }`}>
                                                        {story.priority || "Med"}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400">{story.points || "0"} pts</span>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-800">{story.title || "Untitled Story"}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between pt-8 border-t border-slate-100">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="text-slate-500 font-bold hover:text-slate-800 px-6 py-3 transition-colors"
                                    >
                                        Back to Edit
                                    </button>
                                    <button
                                        onClick={handleSaveProject}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                    >
                                        <Save className="w-5 h-5" />
                                        Create Project
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default NewProject;
