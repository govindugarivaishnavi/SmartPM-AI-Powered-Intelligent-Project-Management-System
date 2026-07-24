import React, { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    Users, AlertTriangle, CheckCircle2, Clock,
    CircleDashed, TrendingUp, AlertCircle, RefreshCw, Sparkles
} from 'lucide-react';
import api from '../services/api';

// ─── Tooltip ──────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">{label}</p>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium">{payload[0].value} Story Points</p>
            </div>
        );
    }
    return null;
};

// ─── Status Badge ──────────────────────────────
const StatusBadge = ({ status }) => {
    if (status === 'Overloaded') {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Overloaded</span>
            </div>
        );
    }
    if (status === 'Unassigned') {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg">
                <CircleDashed className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Unassigned</span>
            </div>
        );
    }
    return null;
};

// ─── Main Component ────────────────────────────
const TeamWorkload = () => {
    const [teamData, setTeamData] = useState([]);
    const [stats, setStats] = useState({ totalMembers: 0, totalPoints: 0, avgPoints: 0, projectCount: 0, taskCount: 0 });
    const [loading, setLoading] = useState(true);
    const [rebalancing, setRebalancing] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [error, setError] = useState(null);

    // ── Fetch real workload from backend ──────────
    const fetchWorkload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/workload');
            setTeamData(data.members || []);
            setStats({
                totalMembers: data.stats?.totalMembers ?? 0,
                totalPoints: data.stats?.totalPoints ?? 0,
                avgPoints: data.stats?.avgPoints ?? 0,
                projectCount: data.projectCount ?? 0,
                taskCount: data.taskCount ?? 0
            });
        } catch (err) {
            console.error('Workload fetch failed:', err);
            setError('Could not load workload data. Please try refreshing.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkload();
    }, [fetchWorkload]);

    // ── Smart Rebalance ────────────────────────────
    const handleRebalance = async () => {
        setRebalancing(true);
        setLastResult(null);
        try {
            const { data } = await api.post('/workload/rebalance');
            setLastResult(data);
            await fetchWorkload(); // Refresh workload after rebalance
        } catch (err) {
            console.error('Rebalance failed:', err);
            setLastResult({ success: false, message: err.response?.data?.message || 'Rebalancing failed.' });
        } finally {
            setRebalancing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm font-medium">Analysing team workload...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 p-8">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-medium">{error}</p>
                <button onClick={fetchWorkload} className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors">Retry</button>
            </div>
        );
    }

    const overloaded = teamData.find(m => m.status === 'Overloaded');

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Team Workload</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Live distribution across {stats.projectCount} project(s) · {stats.taskCount} total tasks
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchWorkload}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>

                    <button
                        onClick={handleRebalance}
                        disabled={rebalancing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-colors text-sm font-bold shadow-sm"
                    >
                        {rebalancing
                            ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : <Sparkles className="w-4 h-4" />
                        }
                        {rebalancing ? 'Rebalancing...' : 'Smart Rebalance'}
                    </button>
                </div>
            </div>

            {/* ── Rebalance Result Banner ── */}
            {lastResult && (
                <div className={`rounded-2xl p-4 flex items-start gap-4 border ${lastResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'
                    : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20'}`}>
                    <div className={`p-2 rounded-xl ${lastResult.success ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                        {lastResult.success
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            : <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                    </div>
                    <div>
                        <h3 className={`font-bold mb-1 ${lastResult.success ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                            {lastResult.success ? 'Rebalancing Complete' : 'Rebalancing Failed'}
                        </h3>
                        <p className={`text-sm ${lastResult.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                            {lastResult.message}
                            {lastResult.reassignments?.length > 0 && (
                                <span className="block mt-1 text-xs opacity-80">
                                    {lastResult.reassignments.slice(0, 5).map(r => `"${r.taskTitle}" → ${r.newAssignee}`).join(' | ')}
                                    {lastResult.reassignments.length > 5 && ` …and ${lastResult.reassignments.length - 5} more`}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Overload Warning ── */}
            {overloaded && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-4 flex items-start gap-4">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-800 dark:text-amber-200 mb-1">Workload Imbalance Detected</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            <span className="font-bold">{overloaded.name}</span>{' '}
                            has significantly more story points than the team average ({stats.avgPoints} pts).
                            Click <strong>Smart Rebalance</strong> to auto-redistribute tasks based on skills and availability.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Team Members</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalMembers}</h3>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Story Points</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalPoints}</h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Avg Points/Member</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{stats.avgPoints}</h3>
                    </div>
                    <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                </div>
            </div>

            {/* ── Empty State ── */}
            {teamData.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-16 flex flex-col items-center gap-4 text-slate-400">
                    <Users className="w-12 h-12 opacity-30" />
                    <p className="text-lg font-semibold">No team data found</p>
                    <p className="text-sm text-center max-w-sm">Create a project with team members and tasks to see the workload distribution.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* ── Chart ── */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Workload Distribution</h3>
                        <div style={{ height: Math.max(300, teamData.length * 46) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={teamData}
                                    margin={{ top: 0, right: 30, left: 60, bottom: 0 }}
                                    barSize={20}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={110}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                                        {teamData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ── Member List ── */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Team Members</h3>
                        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                            {teamData.map((member, i) => (
                                <div key={member.id || i} className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm text-white"
                                                style={{ backgroundColor: member.color || '#6366F1' }}
                                            >
                                                {member.avatar}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{member.name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {member.tasks} tasks · {member.points} pts
                                                </p>
                                            </div>
                                        </div>
                                        <StatusBadge status={member.status} />
                                    </div>

                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium">Completion</span>
                                            <span className="text-slate-800 dark:text-slate-200 font-bold">{member.completion}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${member.completion}%`, backgroundColor: member.color || '#6366F1' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>{member.done} done</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                                            <CircleDashed className="w-3.5 h-3.5" />
                                            <span>{member.inProgress} in progress</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{member.todo} todo</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default TeamWorkload;
