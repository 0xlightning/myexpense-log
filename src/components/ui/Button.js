import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export function Button({ className, variant = 'primary', size = 'md', children, ...props }) {
    const variants = {
        primary: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-200/50',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            className={twMerge(
                clsx(
                    'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
                    variants[variant],
                    sizes[size],
                    className
                )
            )}
            {...props}
        >
            {children}
        </button>
    );
}
