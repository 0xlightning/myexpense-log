import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    TrendingDown,
    CreditCard,
    ArrowUpRight,
    LogOut,
    Menu,
    X,
    ArrowRightLeft,
    Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../services/firebase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Cards', icon: CreditCard, path: '/card' },
        { name: 'Income', icon: Wallet, path: '/income' },
        { name: 'Exchange', icon: ArrowRightLeft, path: '/exchange' },
        { name: 'Expenditure', icon: TrendingDown, path: '/expenditure' },
        { name: 'On Credit', icon: ArrowUpRight, path: '/on-credit' },
        { name: 'Investments', icon: Briefcase, path: '/investments' },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="fixed top-4 left-4 z-50 p-2 bg-slate-900/90 backdrop-blur-md text-white rounded-lg md:hidden border border-white/10 shadow-lg"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={twMerge(
                "fixed top-0 left-0 h-full w-72 bg-slate-950 text-slate-300 flex flex-col transition-transform duration-300 z-40 border-r border-slate-800 shadow-2xl",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-8">
                    <h1 className="text-2xl font-black text-white tracking-widest uppercase">
                        EXPENSIVE
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-[0.2em]">Wealth Management</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "text-[#0067ff] bg-[#0067ff]/10"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={20}
                                        className={clsx(
                                            "relative z-10 transition-colors duration-200",
                                            isActive ? "text-[#0067ff]" : "text-slate-400 group-hover:text-white"
                                        )}
                                    />
                                    <span className="relative z-10 font-bold tracking-tight text-sm">{item.name}</span>

                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0067ff] rounded-r-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 m-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-black text-sm border border-slate-700">
                            {currentUser?.email?.[0].toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{currentUser?.email}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Premium Plan</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-all duration-300 border border-transparent hover:border-red-500/20"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
}
