import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white relative selection:bg-indigo-500/30">
            {/* Mesh Gradient Background */}
            {/* Mesh Gradient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/30 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse delay-700" />
                <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[100px] animate-pulse delay-1000" />
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
