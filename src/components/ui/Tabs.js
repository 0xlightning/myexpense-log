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
                        "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                        activeTab === tab.id
                            ? "bg-teal-600 text-white shadow-md shadow-teal-200 transform scale-100"
                            : "text-stone-400 hover:text-stone-600 hover:bg-stone-50 scale-95"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
