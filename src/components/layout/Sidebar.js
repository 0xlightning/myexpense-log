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
    ArrowRightLeft
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
                "fixed top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl text-slate-300 flex flex-col transition-transform duration-300 z-40 border-r border-white/5 shadow-2xl",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 tracking-wider">
                        EXPENSIVE
                    </h1>
                    <p className="text-xs text-slate-500 mt-2 font-medium tracking-wide">PREMIUM TRACKER</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "text-white shadow-lg shadow-violet-500/10"
                                    : "hover:text-white"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active Background w/ Gradient */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/90 to-indigo-600/90 opacity-100 transition-opacity" />
                                    )}

                                    {/* Hover Background */}
                                    {!isActive && (
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}

                                    <item.icon
                                        size={22}
                                        className={clsx(
                                            "relative z-10 transition-colors duration-300",
                                            isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                        )}
                                    />
                                    <span className="relative z-10 font-medium tracking-wide">{item.name}</span>

                                    {/* Active Indicator Glow */}
                                    {isActive && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full blur-[2px]" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 m-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/10">
                            {currentUser?.email?.[0].toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{currentUser?.email}</p>
                            <p className="text-xs text-slate-500">Free Plan</p>
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
