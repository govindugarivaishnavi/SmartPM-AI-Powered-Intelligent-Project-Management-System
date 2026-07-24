import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    RefreshCw,
    CheckCircle2,
    Lightbulb,
    AlertTriangle,
    Trophy,
    AlertCircle
} from 'lucide-react';
import api from '../services/api';

const AIInsights = () => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [isGenerating, setIsGenerating] = useState(false);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch insights from backend
    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/ai/insights');
            setInsights(data.insights || []);
        } catch (err) {
            console.error('Failed to fetch insights:', err);
            setError('Could not load insights. Please try refreshing.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const handleGenerateInsights = async () => {
        setIsGenerating(true);
        try {
            await fetchInsights();
        } finally {
            setIsGenerating(false);
        }
    };

    const markAsRead = (id) => {
        setInsights(insights.map(insight =>
            insight.id === id ? { ...insight, read: true } : insight
        ));
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'Win':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-900/10',
                    border: 'border-l-4 border-emerald-500',
                    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                    iconColor: 'text-emerald-600 dark:text-emerald-400',
                    Icon: Trophy
                };
            case 'Tip':
                return {
                    bg: 'bg-indigo-50 dark:bg-indigo-900/10',
                    border: 'border-l-4 border-indigo-500',
                    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                    iconColor: 'text-indigo-600 dark:text-indigo-400',
                    Icon: Lightbulb
                };
            case 'Warning':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/10',
                    border: 'border-l-4 border-amber-500',
                    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                    iconColor: 'text-amber-600 dark:text-amber-400',
                    Icon: AlertTriangle
                };
            case 'Risk':
                return {
                    bg: 'bg-rose-50 dark:bg-rose-900/10',
                    border: 'border-l-4 border-rose-500',
                    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
                    iconColor: 'text-rose-600 dark:text-rose-400',
                    Icon: AlertTriangle
                };
            default:
                return {
                    bg: 'bg-slate-50',
                    border: 'border-l-4 border-slate-500',
                    iconBg: 'bg-slate-100',
                    iconColor: 'text-slate-600',
                    Icon: Sparkles
                };
        }
    };

    const filteredInsights = insights.filter(insight => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Unread') return !insight.read;
        if (activeFilter === 'Risks') return insight.type === 'Risk';
        if (activeFilter === 'Tips') return insight.type === 'Tip';
        if (activeFilter === 'Warnings') return insight.type === 'Warning';
        if (activeFilter === 'Wins') return insight.type === 'Win';
        return true;
    });

    const unreadCount = insights.filter(i => !i.read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Analyzing your projects...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-80">
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-rose-600 dark:text-rose-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-rose-800 dark:text-rose-200 mb-2">Error Loading Insights</h3>
                    <p className="text-rose-700 dark:text-rose-300 text-sm mb-6">{error}</p>
                    <button
                        onClick={fetchInsights}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="mt-1">
                        <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            AI Insights
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                            Intelligent recommendations to optimize your projects
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleGenerateInsights}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-70"
                >
                    <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Analyzing...' : 'Generate Insights'}</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
                {['All', 'Unread', 'Risks', 'Tips', 'Warnings', 'Wins'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`
                            px-4 py-1.5 rounded-full text-sm font-medium transition-all
                            ${activeFilter === filter
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                                : 'text-slate-500 hover:bg-white/50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50'}
                        `}
                    >
                        {filter}
                        {filter === 'Unread' && unreadCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-indigo-600 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                        {filter === 'All' && (
                            <span className="ml-2 text-slate-400 font-normal">
                                {insights.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Insights List */}
            <div className="space-y-4">
                {filteredInsights.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
                            {insights.length === 0 ? 'No projects to analyze yet' : 'No matching insights'}
                        </h3>
                        <p className="text-slate-500 text-sm">
                            {insights.length === 0 
                                ? 'Create a project with tasks to generate smart insights'
                                : 'Try adjusting your filters or generate new insights'}
                        </p>
                    </div>
                ) : (
                    filteredInsights.map((insight) => {
                        const style = getTypeStyles(insight.type);
                        const Icon = style.Icon;

                        return (
                            <div
                                key={insight.id}
                                className={`
                                    relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md
                                    ${style.bg} ${style.border}
                                    ${insight.read ? 'opacity-75 grayscale-[30%]' : 'opacity-100'}
                                `}
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl shrink-0 ${style.iconBg}`}>
                                            <Icon className={`w-6 h-6 ${style.iconColor}`} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                                    {insight.title}
                                                </h3>
                                            </div>

                                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                                                {insight.description}
                                            </p>

                                            <div className="flex items-center gap-4">
                                                {!insight.read && (
                                                    <button
                                                        onClick={() => markAsRead(insight.id)}
                                                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Mark as Read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AIInsights;
