import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Input({ className, ...props }) {
    return (
        <input
            className={twMerge(
                'w-full rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all sm:text-sm',
                className
            )}
            {...props}
        />
    );
}
