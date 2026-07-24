import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Settings, User as UserIcon, Eye, LogOut } from 'lucide-react';

const statusIndicators = {
    online: { label: 'Online', color: 'bg-emerald-500', dot: 'bg-emerald-400' },
    away: { label: 'Away', color: 'bg-amber-500', dot: 'bg-amber-400' },
    offline: { label: 'Offline', color: 'bg-rose-500', dot: 'bg-rose-400' },
};

const UserProfileCard = ({ user, stats = {}, currentSprint = '—', status = 'online', onLogout }) => {
    const navigate = useNavigate();
    const profileName = user?.username || 'Guest';
    const profileEmail = user?.email || 'No email available';
    const profileRole = user?.role === 'admin' ? 'Admin' : 'Team Member';

    const { totalProjects = 0, completedTasks = 0 } = stats;

    const statusInfo = statusIndicators[status] ?? statusIndicators.online;

    return (
        <div className="mb-4 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <div className="flex items-start gap-3">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-200" />
                    </div>
                    <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-surface ${statusInfo.dot}`}
                        title={statusInfo.label}
                    />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{profileName}</p>
                        <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusInfo.color} text-white`}> {statusInfo.label} </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{profileEmail}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{profileRole}</p>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="rounded-xl bg-white/80 dark:bg-white/5 px-2 py-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-200">{totalProjects}</p>
                    <p className="truncate">Projects</p>
                </div>
                <div className="rounded-xl bg-white/80 dark:bg-white/5 px-2 py-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-200">{completedTasks}</p>
                    <p className="truncate">Completed</p>
                </div>
                <div className="rounded-xl bg-white/80 dark:bg-white/5 px-2 py-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-200 truncate">{currentSprint || '—'}</p>
                    <p className="truncate">Current Sprint</p>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
                <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-white/70 dark:bg-white/5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </div>
    );
};

const ChevronRightIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-slate-400"
    >
        <path
            d="M9 18l6-6-6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default UserProfileCard;
