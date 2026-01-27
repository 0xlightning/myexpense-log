import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Card({ className, children, ...props }) {
    return (
        <div
            className={twMerge('rounded-xl border border-gray-200 bg-white shadow-sm', className)}
            {...props}
        >
            {children}
        </div>
    );
}
