import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Card({ className, children, ...props }) {
    return (
        <div
            className={twMerge('rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl', className)}
            {...props}
        >
            {children}
        </div>
    );
}
