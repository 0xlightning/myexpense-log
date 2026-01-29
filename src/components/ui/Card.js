import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Card({ className, children, ...props }) {
    return (
        <div
            className={twMerge('rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#0067ff]/30', className)}
            {...props}
        >
            {children}
        </div>
    );
}
