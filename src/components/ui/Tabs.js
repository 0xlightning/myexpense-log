import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Tabs({ tabs, activeTab, onChange, className }) {
    return (
        <div className={twMerge(
            "flex p-1.5 gap-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-x-auto no-scrollbar",
            className
        )}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={twMerge(
                        "whitespace-nowrap px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-xl outline-none",
                        activeTab === tab.id
                            ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/20"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
