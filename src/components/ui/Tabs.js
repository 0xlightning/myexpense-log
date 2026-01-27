import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Tabs({ tabs, activeTab, onChange, className }) {
    return (
        <div className={twMerge("flex space-x-1 rounded-xl bg-gray-100 p-1", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={twMerge(
                        "w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                        activeTab === tab.id
                            ? "bg-white text-blue-700 shadow"
                            : "text-gray-500 hover:bg-white/[0.12] hover:text-black"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
