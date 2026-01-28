import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Input({ className, ...props }) {
    return (
        <input
            className={twMerge(
                'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-[#0067ff] focus:outline-none focus:ring-4 focus:ring-[#0067ff]/10 transition-all sm:text-sm',
                className
            )}
            {...props}
        />
    );
}
