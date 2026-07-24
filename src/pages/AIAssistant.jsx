import React, { useState } from 'react';
import { Send, Sparkles, Wand2, ListChecks, Lightbulb, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import aiService from '../services/aiService';

const AIAssistant = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your SmartPM AI. I can help you generate project ideas, break down tasks, or improve your documentation. How can I assist you today?", id: 1 }
    ]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input, id: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Determine request type based on keywords
            let type = 'general';
            if (input.toLowerCase().includes('idea')) type = 'project_ideas';
            else if (input.toLowerCase().includes('breakdown') || input.toLowerCase().includes('steps')) type = 'task_breakdown';
            else if (input.toLowerCase().includes('time') || input.toLowerCase().includes('schedule')) type = 'timeline';

            const response = await aiService.generateAIContent(input, type);

            const aiMsg = {
                role: 'assistant',
                content: response.data,
                id: Date.now() + 1
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Sorry, I'm having trouble connecting to my specialized project management brain right now.";
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: errorMessage,
                id: Date.now() + 1
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = () => setMessages([]);

    return (
        <div className="flex h-[calc(100vh-160px)] gap-6 font-inter">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-dark-border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
                            <Sparkles className="text-primary-600 dark:text-primary-400 w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold dark:text-white font-outfit">AI Project Specialist</h2>
                            <p className="text-xs text-emerald-500 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                Synchronized
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={clearHistory}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-all"
                        title="Clear Chat"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`
                                    max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed
                                    ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-tr-none shadow-lg shadow-primary-500/20'
                                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-dark-border shadow-sm'}
                                `}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 flex gap-2">
                                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-150"></span>
                                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-300"></span>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSend} className="p-6 border-t border-slate-100 dark:border-dark-border bg-slate-50/30 dark:bg-dark-bg/20">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="E.g. Help me break down a task for building a login feature..."
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-dark-border rounded-xl px-4 py-4 pr-16 text-sm focus:border-primary-500 transition-all resize-none outline-none dark:text-white"
                            rows="3"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-3 bottom-3 p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-900 text-white rounded-lg transition-all shadow-md active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setInput('Suggest 5 project ideas for a SaaS platform')} className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-400 rounded-full hover:border-primary-400 transition-colors flex items-center gap-1.5 font-bold">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Project Ideas
                        </button>
                        <button type="button" onClick={() => setInput('Break down this task: Create a MongoDB schema for a task app')} className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-400 rounded-full hover:border-primary-400 transition-colors flex items-center gap-1.5 font-bold">
                            <ListChecks className="w-3.5 h-3.5 text-primary-500" /> Task Breakdown
                        </button>
                        <button type="button" onClick={() => setInput('Improve this task description: Build the sidebar with icons')} className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-400 rounded-full hover:border-primary-400 transition-colors flex items-center gap-1.5 font-bold">
                            <Wand2 className="w-3.5 h-3.5 text-indigo-500" /> Improve Desc
                        </button>
                    </div>
                </form>
            </div>

            {/* History Sidebar */}
            <div className="w-80 bg-white dark:bg-dark-surface rounded-3xl border border-slate-200 dark:border-dark-border shadow-sm p-6 hidden xl:flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                    <History className="text-slate-400 w-5 h-5" />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 font-outfit uppercase tracking-widest text-xs">AI Context History</h3>
                </div>
                <div className="flex-1 space-y-4">
                    {[
                        { tag: 'Idea', text: 'E-commerce dashboard analytics...', time: 'Oct 12' },
                        { tag: 'Dev', text: 'Auth flow for React applications...', time: 'Oct 10' },
                        { tag: 'Task', text: 'Database optimization checklist...', time: 'Oct 08' },
                    ].map((item, i) => (
                        <div key={i} className="p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-all border-2 border-transparent hover:border-slate-50 dark:hover:border-dark-border">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-lg">
                                {item.tag}
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {item.text}
                            </p>
                            <span className="text-[10px] font-bold text-slate-400 mt-2 block">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
