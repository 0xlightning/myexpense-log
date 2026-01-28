import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Tabs({ tabs, activeTab, onChange, className }) {
    return (
        <div className={twMerge(
            "flex p-1 gap-1 rounded-xl bg-slate-100 border border-slate-200 overflow-x-auto no-scrollbar",
            className
        )}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={twMerge(
                        "whitespace-nowrap px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 rounded-lg outline-none",
                        activeTab === tab.id
                            ? "bg-white text-[#0067ff] shadow-sm border border-slate-200"
                            : "text-slate-500 hover:text-[#0067ff] hover:bg-white/50"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
