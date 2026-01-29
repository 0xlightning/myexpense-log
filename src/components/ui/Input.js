import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Input({ className, ...props }) {
    return (
        <input
            className={twMerge(
                'w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-stone-900 placeholder-stone-400 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/10 transition-all sm:text-sm',
                className
            )}
            {...props}
        />
    );
}
