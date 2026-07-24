import React from 'react';
import { User, Shield, Bell, Zap, Palette, Globe } from 'lucide-react';

const Settings = () => {
    const sections = [
        { title: 'Profile', icon: User, desc: 'Manage your personal information and preferences' },
        { title: 'Security', icon: Shield, desc: 'Password, 2FA, and session management' },
        { title: 'Notifications', icon: Bell, desc: 'Configure how you receive updates' },
        { title: 'AI Model', icon: Zap, desc: 'Select and configure AI model parameters' },
        { title: 'Appearance', icon: Palette, desc: 'Change themes and visual preferences' },
        { title: 'Language', icon: Globe, desc: 'Set your preferred language and region' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold dark:text-white font-outfit">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your account settings and application preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section) => (
                    <div key={section.title} className="bg-white dark:bg-dark-surface p-6 rounded-2xl border border-slate-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-900/40 transition-all cursor-pointer group">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition-colors">
                                <section.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">{section.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{section.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-primary-600/5 dark:bg-primary-600/10 border border-primary-200 dark:border-primary-900/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 justify-center md:justify-start">
                        <Zap className="w-5 h-5 text-primary-600" /> Upgrade to Pro
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Get unlimited AI suggestions and advanced analytics.</p>
                </div>
                <button className="w-full md:w-auto px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 transition-all active:scale-95">
                    View Plans
                </button>
            </div>
        </div>
    );
};

export default Settings;
