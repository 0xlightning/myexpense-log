import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, collections } from '../services/firestore';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Activity, TrendingUp, TrendingDown, Banknote } from 'lucide-react';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('analytics');
    const [loading, setLoading] = useState(true);

    // Data
    const [ledger, setLedger] = useState([]);
    const [cards, setCards] = useState([]);
    const [categories, setCategories] = useState([]);

    const [error, setError] = useState(null);

    // Filters
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

    useEffect(() => {
        if (currentUser) {
            let mounted = true;
            let loadedCount = 0;
            const requiredDataSources = 3;
            const trackers = { ledger: false, cards: false, categories: false };

            const checkLoading = (source) => {
                if (!mounted) return;
                if (!trackers[source]) {
                    trackers[source] = true;
                    loadedCount++;
                }

                if (loadedCount >= requiredDataSources) {
                    setLoading(false);
                }
            };

            const handleError = (err) => {
                console.error("Dashboard subscription error:", err);
                if (mounted) {
                    setError(err.message || "Failed to load data");
                    setLoading(false);
                }
            };

            // Safety timeout: stop loading after 10 seconds even if data hasn't arrived
            const timer = setTimeout(() => {
                if (mounted && loading) {
                    console.warn("Dashboard load timed out");
                    setLoading(false);
                }
            }, 10000);

            const unsubLedger = subscribeToCollection(currentUser.uid, collections.transactions, (data) => {
                setLedger(data);
                checkLoading('ledger');
            }, handleError);

            const unsubCards = subscribeToCollection(currentUser.uid, collections.cards, (data) => {
                setCards(data.filter(c => c.isActive !== false));
                checkLoading('cards');
            }, handleError);

            const unsubCats = subscribeToCollection(currentUser.uid, collections.expense_categories, (data) => {
                setCategories(data);
                checkLoading('categories');
            }, handleError);

            return () => {
                mounted = false;
                clearTimeout(timer);
                unsubLedger();
                unsubCards();
                unsubCats();
            };
        }
    }, [currentUser, loading]);

    // --- Aggregations ---
    const netWorth = cards.filter(c => c.isActive !== false).reduce((sum, c) => sum + (c.balance || 0), 0);

    const stats = ledger.reduce((acc, tx) => {
        const val = parseFloat(tx.amount || 0);
        switch (tx.type) {
            case 'income':
                acc.income += val;
                break;
            case 'expense':
                acc.expense += val;
                // Accumulate category data
                const catName = categories.find(c => c.id === tx.categoryId)?.name || 'Uncategorized';
                acc.byCategory[catName] = (acc.byCategory[catName] || 0) + val;
                break;
            case 'credit_usage':
                acc.credit += val;
                break;
            default:
                break;
        }
        return acc;
    }, { income: 0, expense: 0, credit: 0, byCategory: {} });

    // Charts for Lifetime Analytics
    const categoryChartData = Object.entries(stats.byCategory)
        .map(([name, amount], index) => ({
            name,
            amount,
            color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.amount - a.amount);

    // --- Monthly Analytics (Filtered) ---
    const monthlyFiltered = ledger.filter(tx => tx.date && tx.date.startsWith(selectedMonth)).reduce((acc, tx) => {
        const val = parseFloat(tx.amount || 0);
        if (tx.type === 'income') acc.income += val;
        else if (tx.type === 'expense') {
            acc.expense += val;
            const catName = categories.find(c => c.id === tx.categoryId)?.name || 'Uncategorized';
            acc.byCategory[catName] = (acc.byCategory[catName] || 0) + val;
        }
        else if (tx.type === 'credit_usage') {
            acc.credit += val;
            if (!tx.isPaid) acc.unpaidCredit += val;
            // Also count credit usage in category stats if it has a category
            const catName = categories.find(c => c.id === tx.categoryId)?.name || 'Uncategorized';
            acc.byCategory[catName] = (acc.byCategory[catName] || 0) + val;
        }
        return acc;
    }, { income: 0, expense: 0, credit: 0, unpaidCredit: 0, byCategory: {} });

    const monthlyCategoryChartData = Object.entries(monthlyFiltered.byCategory)
        .map(([name, amount], index) => ({
            name,
            amount,
            color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.amount - a.amount);

    const monthlyDistData = [
        { name: 'Income', amount: monthlyFiltered.income, fill: '#10b981' },
        { name: 'Spending', amount: monthlyFiltered.expense, fill: '#ef4444' },
        { name: 'Credit', amount: monthlyFiltered.credit, fill: '#f59e0b' }
    ];

    // --- Yearly Analytics (Filtered) ---
    const yearlyFiltered = ledger.filter(tx => tx.date && tx.date.startsWith(selectedYear)).reduce((acc, tx) => {
        const val = parseFloat(tx.amount || 0);
        const dateObj = new Date(tx.date);
        const monthIndex = dateObj.getMonth();

        if (tx.type === 'income') {
            acc.income += val;
            acc.monthlyPerformance[monthIndex].income += val;
        } else if (tx.type === 'expense') {
            acc.expense += val;
            acc.monthlyPerformance[monthIndex].expense += val;

            // Breakdown by Name
            const name = tx.notes || tx.categoryName || 'General Expense';
            acc.byName[name] = (acc.byName[name] || 0) + val;

            // Breakdown by Category
            const catName = categories.find(c => c.id === tx.categoryId)?.name || 'Uncategorized';
            acc.byCategory[catName] = (acc.byCategory[catName] || 0) + val;
        } else if (tx.type === 'credit_usage') {
            acc.credit += val;
            if (!tx.isPaid) acc.unpaidCredit += val;
            acc.monthlyPerformance[monthIndex].expense += val;

            // Breakdown by Category
            const catName = categories.find(c => c.id === tx.categoryId)?.name || 'Uncategorized';
            acc.byCategory[catName] = (acc.byCategory[catName] || 0) + val;
        }
        return acc;
    }, {
        income: 0, expense: 0, credit: 0, unpaidCredit: 0,
        byName: {},
        byCategory: {},
        monthlyPerformance: Array.from({ length: 12 }, (_, i) => ({
            name: new Date(0, i).toLocaleString('default', { month: 'short' }),
            income: 0,
            expense: 0,
            savings: 0
        }))
    });

    // Finalize savings data
    yearlyFiltered.monthlyPerformance.forEach(m => m.savings = m.income - m.expense);

    const yearlyDistData = [
        { name: 'Income', amount: yearlyFiltered.income, fill: '#10b981' },
        { name: 'Spending', amount: yearlyFiltered.expense, fill: '#ef4444' },
        { name: 'Credit', amount: yearlyFiltered.credit, fill: '#f59e0b' }
    ];

    const sortedYearlyByCategory = Object.entries(yearlyFiltered.byCategory)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

    // Available filters
    const availableMonths = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), i, 1);
        return d.toISOString().slice(0, 7);
    });
    const availableYears = [String(now.getFullYear()), String(now.getFullYear() - 1)];

    // Lifetime Analytics (Current "Analytics" tab) - reusing stats logic for clarity
    const lifetimeDistData = [
        { name: 'Income', amount: stats.income, fill: '#10b981' },
        { name: 'Expense', amount: stats.expense, fill: '#ef4444' },
        { name: 'Credit Used', amount: stats.credit, fill: '#f59e0b' }
    ];

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="animate-pulse space-y-4 text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto"></div>
                <div className="text-gray-400 font-medium">Loading Financial Data...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-rose-50 border border-rose-100 p-8 rounded-2xl text-center max-w-md">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Failed to load data</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Financial Dashboard</h1>
                    <p className="text-slate-500 mt-1 font-medium">Real-time financial intelligence and lifetime analytics.</p>
                </div>

                <Tabs
                    tabs={[
                        { id: 'analytics', label: 'Analytics' },
                        { id: 'monthly', label: 'Monthly Analytics' },
                        { id: 'yearly', label: 'Yearly Analytics' },
                        { id: 'summary', label: 'Summary' }
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="w-full md:w-auto min-w-[300px]"
                />
            </div>

            {activeTab === 'analytics' && (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Net Worth - Premium Card */}
                        <div className="relative group overflow-hidden bg-white border border-slate-200 rounded-xl p-6 shadow-sm transition-all hover:border-[#0067ff]/30">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <Wallet size={24} className="text-indigo-600" />
                                    </div>
                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                        <TrendingUp size={12} /> Live
                                    </span>
                                </div>

                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Total Net Worth</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                                    ${netWorth.toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        {/* Income */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-emerald-500/30 transition-all shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 rounded-lg relative z-10 border border-emerald-100">
                                    <ArrowUpRight size={24} className="text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest relative z-10">Total Income</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10">
                                ${stats.income.toLocaleString()}
                            </h3>
                        </div>

                        {/* Expense */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-rose-500/30 transition-all shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-rose-50 rounded-lg relative z-10 border border-rose-100">
                                    <ArrowDownRight size={24} className="text-rose-600" />
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest relative z-10">Total Spending</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10">
                                ${stats.expense.toLocaleString()}
                            </h3>
                        </div>

                        {/* Credit */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-amber-500/30 transition-all shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 rounded-lg relative z-10 border border-amber-100">
                                    <CreditCard size={24} className="text-amber-600" />
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest relative z-10">Credit Usage</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1 relative z-10">
                                ${stats.credit.toLocaleString()}
                            </h3>
                        </div>
                    </div>

                    {/* Charts Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Chart */}
                        <div className="lg:col-span-2 bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-base font-bold text-slate-900 uppercase tracking-widest">Spending Priority</h3>
                                <div className="flex gap-2">
                                    {/* Legend could go here */}
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryChartData} barSize={40}>
                                        <defs>
                                            {categoryChartData.map((entry, index) => (
                                                <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            tickFormatter={(value) => `$${value}`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                            {categoryChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={`url(#color-${index})`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Side Chart */}
                        <div className="lg:col-span-1 bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 mb-8 uppercase tracking-widest">Distribution</h3>
                            <div className="h-[300px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={lifetimeDistData}
                                            dataKey="amount"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            stroke="none"
                                        >
                                            {lifetimeDistData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Stats */}
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Flow</p>
                                    <p className="text-xl font-black text-slate-900 tracking-tighter">${(stats.income + stats.expense).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="space-y-4 mt-8">
                                {lifetimeDistData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                            <span className="text-slate-500 font-bold tracking-tight uppercase text-xs">{item.name}</span>
                                        </div>
                                        <span className="font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 transition-all group-hover:bg-indigo-50 group-hover:border-indigo-100">
                                            ${item.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'monthly' && (
                <div className="space-y-8">
                    {/* Header with Selected Month */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">
                                {new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long' })}
                                {" "}{selectedMonth.split('-')[0]}
                            </h2>
                            <p className="text-sm font-bold text-indigo-600/60 mt-1 uppercase tracking-widest">Monthly Performance Breakdown</p>
                        </div>

                        {/* Month Filter Selector */}
                        <div className="flex items-center gap-4 bg-white/70 p-3 px-5 rounded-2xl border border-white/40 shadow-xl backdrop-blur-md">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Period:</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-transparent border-none text-sm font-black text-slate-900 outline-none cursor-pointer pr-8 hover:text-indigo-600 transition-colors"
                            >
                                {availableMonths.map(m => (
                                    <option key={m} value={m} className="bg-white text-slate-900">
                                        {new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6 bg-white border border-slate-200 text-slate-900 relative overflow-hidden group shadow-sm">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Net Worth</p>
                            <h3 className="text-2xl font-bold tracking-tight">${netWorth.toLocaleString()}</h3>
                            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-600 font-bold bg-slate-100 w-fit px-2 py-1 rounded-full border border-slate-200">
                                <Activity size={10} /> LIFETIME
                            </div>
                        </Card>
                        <Card className="p-6 bg-white/70 border-white/40 backdrop-blur-xl shadow-xl">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Monthly Income</p>
                            <h3 className="text-2xl font-black text-emerald-600">${monthlyFiltered.income.toLocaleString()}</h3>
                        </Card>
                        <Card className="p-6 bg-white/70 border-white/40 backdrop-blur-xl shadow-xl">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Monthly Spending</p>
                            <h3 className="text-2xl font-black text-rose-600">${monthlyFiltered.expense.toLocaleString()}</h3>
                        </Card>
                        <Card className="p-6 bg-white/70 border-white/40 backdrop-blur-xl shadow-xl">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Credit Usage</p>
                            <h3 className="text-2xl font-black text-amber-600">${monthlyFiltered.credit.toLocaleString()}</h3>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Monthly Bar Chart */}
                        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                            <h3 className="text-lg font-black text-white mb-8 uppercase tracking-widest">Monthly Allocation</h3>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyCategoryChartData} barSize={40}>
                                        <defs>
                                            {monthlyCategoryChartData.map((entry, index) => (
                                                <linearGradient key={`grad-m-${index}`} id={`color-m-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            tickFormatter={(value) => `$${value}`}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                            {monthlyCategoryChartData.map((entry, index) => (
                                                <Cell key={`cell-m-${index}`} fill={`url(#color-m-${index})`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Monthly Distribution Pie Chart */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/40 shadow-xl">
                            <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-widest">Monthly Split</h3>
                            <div className="h-[300px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={monthlyDistData}
                                            dataKey="amount"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            stroke="none"
                                        >
                                            {monthlyDistData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-3 mt-4">
                                {monthlyDistData.map(item => (
                                    <div key={item.name} className="flex items-center justify-between text-sm group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                                            <span className="text-sm font-bold text-slate-500 uppercase tracking-tighter">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 group-hover:bg-indigo-50 transition-colors italic">${item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'yearly' && (
                <div className="space-y-8">
                    {/* Header with Selected Year */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">
                                Year {selectedYear}
                            </h2>
                            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Annual Financial Overview</p>
                        </div>

                        {/* Year Filter Selector */}
                        <div className="flex items-center gap-4 bg-white/70 p-3 px-5 rounded-2xl border border-white/40 shadow-xl backdrop-blur-md">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Year:</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-transparent border-none text-sm font-black text-slate-900 outline-none cursor-pointer pr-8 hover:text-indigo-600 transition-colors"
                            >
                                {availableYears.map(y => (
                                    <option key={y} value={y} className="bg-white text-slate-900">{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>


                    {/* Annual Performance Chart (Income vs Expense) */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/40 shadow-xl">
                        <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-widest">Annual Flux</h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearlyFiltered.monthlyPerformance} barGap={8}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Spending" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Annual Summary Table - High Impact Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
                                <p className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">${yearlyFiltered.income.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 group-hover:bg-white transition-all">
                                <TrendingUp className="text-emerald-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-rose-500/30 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
                                <p className="text-2xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors">${yearlyFiltered.expense.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 group-hover:bg-white transition-all">
                                <TrendingDown className="text-rose-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-[#0067ff]/30 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yearly Savings</p>
                                <p className="text-2xl font-bold text-slate-900 group-hover:text-[#0067ff] transition-colors">${(yearlyFiltered.income - yearlyFiltered.expense).toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 group-hover:bg-white transition-all">
                                <Banknote className="text-[#0067ff]" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Breakdown by Category */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/40 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Category Spend</h3>
                                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-100">Yearly Total</div>
                            </div>
                            <div className="space-y-4">
                                {sortedYearlyByCategory.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-[#0067ff]/20 hover:shadow-sm transition-all">
                                        <span className="font-bold text-slate-600 group-hover:text-[#0067ff] transition-colors capitalize">{item.name}</span>
                                        <span className="font-bold text-slate-900 text-lg tracking-tight">${item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                                {sortedYearlyByCategory.length === 0 && (
                                    <div className="text-center py-12 text-indigo-300/30 italic font-medium uppercase tracking-widest text-xs">No annual data found.</div>
                                )}
                            </div>
                        </div>

                        {/* Distribution Chart */}
                        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/40 shadow-xl">
                            <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-widest">Yearly Split</h3>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={yearlyDistData}
                                            dataKey="amount"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            stroke="none"
                                        >
                                            {yearlyDistData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4 mt-8">
                                {yearlyDistData.map(item => (
                                    <div key={item.name} className="flex items-center justify-between text-sm group">
                                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{item.name}</span>
                                        <span className="font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all tracking-tight">${item.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Savings Chart */}
                    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-white/40 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Savings Velocity</h3>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-[0.2em]">Net Monthly Growth Rate</p>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={yearlyFiltered.monthlyPerformance}>
                                    <defs>
                                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 900, marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSavings)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-8 bg-white border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-8 uppercase tracking-widest">Financial Health</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Savings Rate</span>
                                <span className="font-bold text-2xl text-emerald-600 tracking-tight">
                                    {stats.income > 0 ? (((stats.income - stats.expense) / stats.income) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Debt To Income</span>
                                <span className="font-bold text-2xl text-amber-600 tracking-tight">
                                    {stats.income > 0 ? ((stats.credit / stats.income) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
