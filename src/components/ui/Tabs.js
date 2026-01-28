import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Tabs({ tabs, activeTab, onChange, className }) {
    return (
        <div className={twMerge(
            "flex p-1.5 gap-2 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl overflow-x-auto no-scrollbar",
            className
        )}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={twMerge(
                        "whitespace-nowrap px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-xl outline-none",
                        activeTab === tab.id
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 border border-indigo-500"
                            : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
