import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    return (
        <div className="min-h-screen bg-slate-50 relative selection:bg-violet-500/30">
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200 blur-[120px]" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-fuchsia-100 blur-[100px]" />
            </div>

            <Sidebar />

            <main className="relative z-10 transition-all duration-300 md:ml-72 min-h-screen">
                <div className="container mx-auto p-6 md:p-10 max-w-7xl animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
