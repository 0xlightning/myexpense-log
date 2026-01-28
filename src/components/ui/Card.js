import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Card({ className, children, ...props }) {
    return (
        <div
            className={twMerge('rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl', className)}
            {...props}
        >
            {children}
        </div>
    );
}
