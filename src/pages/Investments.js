import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { addInvestmentTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
    Briefcase, Plus, Calendar, DollarSign, CreditCard,
    Trash2, Edit3, Save, Tag, RotateCcw, TrendingUp,
    TrendingDown, BarChart2, RefreshCw
} from 'lucide-react';

const COLORS = ['#0D9488', '#65A30D', '#0891B2', '#7C3AED', '#EA580C', '#D97706', '#DC2626', '#57534E'];

export default function Investments() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isValueModalOpen, setIsValueModalOpen] = useState(false);
    const [selectedForUpdate, setSelectedForUpdate] = useState(null);
    const [newCurrentValue, setNewCurrentValue] = useState('');

    // --- Data State ---
    const [categories, setCategories] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [cards, setCards] = useState([]);

    // --- Category Tab State ---
    const [categoryName, setCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    // --- Investment Tab State ---
    const [editingInvestment, setEditingInvestment] = useState(null);
    const [categoryId, setCategoryId] = useState('');
    const [customCategoryName, setCustomCategoryName] = useState('');
    const [cardId, setCardId] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const unsubCats = subscribeToCollection(currentUser.uid, collections.investment_categories, setCategories);
        const unsubInv = subscribeToCollection(currentUser.uid, collections.investments, setInvestments);
        const unsubCards = subscribeToCollection(currentUser.uid, collections.cards, (data) => {
            setCards(data.filter(c => c.isActive !== false));
        });
        return () => { unsubCats(); unsubInv(); unsubCards(); };
    }, [currentUser]);

    // --- Portfolio Aggregations ---
    const totalInvested = investments.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const totalCurrentValue = investments.reduce((s, i) => s + parseFloat(i.currentValue ?? i.amount ?? 0), 0);
    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalReturnPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    // By Category breakdown
    const byCategory = investments.reduce((acc, inv) => {
        const catName = inv.categoryId === 'other'
            ? `Other (${inv.customCategoryName || ''})`
            : (categories.find(c => c.id === inv.categoryId)?.name || 'Uncategorized');
        if (!acc[catName]) acc[catName] = { invested: 0, currentValue: 0 };
        acc[catName].invested += parseFloat(inv.amount || 0);
        acc[catName].currentValue += parseFloat(inv.currentValue ?? inv.amount ?? 0);
        return acc;
    }, {});

    const categoryChartData = Object.entries(byCategory)
        .map(([name, data], i) => ({
            name,
            value: data.currentValue,
            invested: data.invested,
            gain: data.currentValue - data.invested,
            color: COLORS[i % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value);

    // Monthly invested chart
    const now = new Date();
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), i, 1);
        const monthKey = `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`;
        const monthName = d.toLocaleString('default', { month: 'short' });
        const invested = investments
            .filter(inv => inv.date?.startsWith(monthKey))
            .reduce((s, inv) => s + parseFloat(inv.amount || 0), 0);
        return { name: monthName, invested };
    });

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { name: categoryName };
            if (editingCategory) {
                await updateItem(currentUser.uid, collections.investment_categories, editingCategory.id, data);
                setEditingCategory(null);
            } else { await addItem(currentUser.uid, collections.investment_categories, data); }
            setCategoryName('');
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleCategoryDelete = async (cat) => {
        if (window.confirm('Delete this category?')) {
            try { await deleteItem(currentUser.uid, collections.investment_categories, cat.id); }
            catch (error) { console.error(error); }
        }
    };

    const handleInvestmentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingInvestment) {
                const data = { categoryId, date, notes: notes || '', customCategoryName: categoryId === 'other' ? customCategoryName : null };
                await updateItem(currentUser.uid, collections.investments, editingInvestment.id, data);
                setEditingInvestment(null);
            } else {
                await addInvestmentTransaction(currentUser.uid, {
                    amount: parseFloat(amount),
                    date,
                    cardId,
                    categoryId,
                    notes: notes || '',
                    customCategoryName: categoryId === 'other' ? customCategoryName : null,
                    currentValue: parseFloat(amount) // initially currentValue = invested amount
                });
            }
            setAmount(''); setNotes(''); setCategoryId(''); setCardId(''); setCustomCategoryName('');
            setIsModalOpen(false);
        } catch (error) { console.error(error); alert('Failed: ' + error.message); }
        finally { setLoading(false); }
    };

    const handleUpdateCurrentValue = async (e) => {
        e.preventDefault();
        if (!selectedForUpdate) return;
        setLoading(true);
        try {
            await updateItem(currentUser.uid, collections.investments, selectedForUpdate.id, {
                currentValue: parseFloat(newCurrentValue)
            });
            setIsValueModalOpen(false);
            setSelectedForUpdate(null);
            setNewCurrentValue('');
        } catch (err) { console.error(err); alert('Failed to update value'); }
        finally { setLoading(false); }
    };

    const openValueModal = (inv) => {
        setSelectedForUpdate(inv);
        setNewCurrentValue(inv.currentValue ?? inv.amount ?? '');
        setIsValueModalOpen(true);
    };

    const handleInvestmentEdit = (investment) => {
        setEditingInvestment(investment);
        setCategoryId(investment.categoryId);
        setCustomCategoryName(investment.customCategoryName || '');
        setCardId(investment.cardId);
        setDate(investment.date);
        setAmount(investment.amount);
        setNotes(investment.notes || '');
        setIsModalOpen(true);
    };

    const handleInvestmentDelete = async (investment) => {
        if (window.confirm('Delete this record? This will reverse the balance effect.')) {
            try {
                await deleteTransaction(currentUser.uid, collections.investments, investment.id, investment.cardId, investment.amount, 'investment');
            } catch (error) { console.error(error); }
        }
    };

    const handleInvestmentRepeat = (investment) => {
        setEditingInvestment(null);
        setCategoryId(investment.categoryId);
        setCustomCategoryName(investment.customCategoryName || '');
        setCardId(investment.cardId);
        setAmount(investment.amount);
        setNotes(investment.notes || '');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingInvestment(null);
        setCategoryId(''); setCustomCategoryName(''); setCardId(''); setAmount(''); setNotes('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-3 uppercase">
                        <Briefcase className="text-teal-600" size={28} />
                        Investments
                    </h1>
                    <p className="text-stone-500 mt-1 font-medium">Track your investment portfolio and performance.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Tabs
                        tabs={[
                            { id: 'overview', label: 'Overview' },
                            { id: 'history', label: 'History' },
                            { id: 'categories', label: 'Categories' }
                        ]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        className="flex-1 md:flex-none"
                    />
                    {(activeTab === 'history' || activeTab === 'overview') && (
                        <Button onClick={handleAddNew} className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200/50 px-4 h-[42px] rounded-xl flex items-center gap-2">
                            <Plus size={18} strokeWidth={3} />
                            <span className="hidden md:inline font-bold uppercase text-xs tracking-wider">Add Investment</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    {/* Portfolio Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100">
                                    <Briefcase size={18} className="text-teal-600" />
                                </div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Invested</p>
                            </div>
                            <h3 className="text-2xl font-black text-stone-900 tracking-tight">${totalInvested.toLocaleString()}</h3>
                            <p className="text-[10px] text-stone-400 mt-1 font-medium">Cost basis across all assets</p>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <BarChart2 size={18} className="text-indigo-600" />
                                </div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Portfolio Value</p>
                            </div>
                            <h3 className="text-2xl font-black text-stone-900 tracking-tight">${totalCurrentValue.toLocaleString()}</h3>
                            <p className="text-[10px] text-stone-400 mt-1 font-medium">Current marked-to-market value</p>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2.5 rounded-xl border ${totalGainLoss >= 0 ? 'bg-lime-50 border-lime-100' : 'bg-rose-50 border-rose-100'}`}>
                                    {totalGainLoss >= 0
                                        ? <TrendingUp size={18} className="text-lime-600" />
                                        : <TrendingDown size={18} className="text-rose-600" />
                                    }
                                </div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Gain / Loss</p>
                            </div>
                            <h3 className={`text-2xl font-black tracking-tight ${totalGainLoss >= 0 ? 'text-lime-600' : 'text-rose-600'}`}>
                                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}
                            </h3>
                            <p className="text-[10px] text-stone-400 mt-1 font-medium">Unrealised P&L</p>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2.5 rounded-xl border ${totalReturnPct >= 0 ? 'bg-lime-50 border-lime-100' : 'bg-rose-50 border-rose-100'}`}>
                                    <TrendingUp size={18} className={totalReturnPct >= 0 ? 'text-lime-600' : 'text-rose-600'} />
                                </div>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Return</p>
                            </div>
                            <h3 className={`text-2xl font-black tracking-tight ${totalReturnPct >= 0 ? 'text-lime-600' : 'text-rose-600'}`}>
                                {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
                            </h3>
                            <p className="text-[10px] text-stone-400 mt-1 font-medium">Overall portfolio return</p>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Pie Chart: Category Allocation */}
                        <Card className="p-8">
                            <h3 className="text-base font-bold text-stone-900 mb-6 uppercase tracking-widest">Portfolio Allocation</h3>
                            {categoryChartData.length > 0 ? (
                                <>
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={categoryChartData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%" cy="50%"
                                                    innerRadius={55} outerRadius={90}
                                                    paddingAngle={4} stroke="none"
                                                >
                                                    {categoryChartData.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(val, name) => [`$${val.toLocaleString()}`, name]}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        {categoryChartData.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-bold ${item.gain >= 0 ? 'text-lime-600' : 'text-rose-600'}`}>
                                                        {item.gain >= 0 ? '+' : ''}${item.gain.toLocaleString()}
                                                    </span>
                                                    <span className="text-xs font-black text-stone-800">${item.value.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-[220px] flex items-center justify-center text-stone-300 text-sm font-medium">
                                    No investments yet.
                                </div>
                            )}
                        </Card>

                        {/* Area Chart: Monthly Investment Activity */}
                        <Card className="p-8">
                            <h3 className="text-base font-bold text-stone-900 mb-6 uppercase tracking-widest">Monthly Investment Activity ({now.getFullYear()})</h3>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData}>
                                        <defs>
                                            <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} tickFormatter={v => `$${v}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={v => [`$${v.toLocaleString()}`, 'Invested']}
                                        />
                                        <Area type="monotone" dataKey="invested" stroke="#0D9488" strokeWidth={3} fill="url(#invGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* Detailed Holdings Table with Update Value btn*/}
                    {investments.length > 0 && (
                        <Card className="p-8">
                            <h3 className="text-base font-bold text-stone-900 mb-6 uppercase tracking-widest">Holdings</h3>
                            <div className="overflow-hidden rounded-xl border border-stone-200">
                                <table className="table-standard">
                                    <thead className="table-header-standard">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Asset / Category</th>
                                            <th className="px-6 py-4 text-right">Invested</th>
                                            <th className="px-6 py-4 text-right">Current Value</th>
                                            <th className="px-6 py-4 text-right">Gain / Loss</th>
                                            <th className="px-6 py-4 text-right">Return %</th>
                                            <th className="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {([...investments]).sort((a, b) => new Date(b.date) - new Date(a.date)).map(inv => {
                                            const invested = parseFloat(inv.amount || 0);
                                            const current = parseFloat(inv.currentValue ?? inv.amount ?? 0);
                                            const gl = current - invested;
                                            const ret = invested > 0 ? (gl / invested) * 100 : 0;
                                            const cat = inv.categoryId === 'other'
                                                ? `Other (${inv.customCategoryName || ''})`
                                                : (categories.find(c => c.id === inv.categoryId)?.name || 'Unknown');
                                            return (
                                                <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <span className="badge-standard bg-stone-50 text-teal-600 border-stone-100">{cat}</span>
                                                            <div className="text-[10px] text-stone-400 mt-0.5">{format(new Date(inv.date), 'MMM dd, yyyy')}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-stone-700">${invested.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-black text-stone-900">${current.toLocaleString()}</td>
                                                    <td className={`px-6 py-4 text-right font-black ${gl >= 0 ? 'text-lime-600' : 'text-rose-600'}`}>
                                                        {gl >= 0 ? '+' : ''}${gl.toLocaleString()}
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-black ${ret >= 0 ? 'text-lime-600' : 'text-rose-600'}`}>
                                                        {ret >= 0 ? '+' : ''}{ret.toFixed(2)}%
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                                                            <button onClick={() => openValueModal(inv)} className="p-2 text-stone-400 hover:text-teal-600 bg-white border border-stone-200 rounded-lg shadow-sm hover:scale-110 transition-all" title="Update Market Value">
                                                                <RefreshCw size={14} />
                                                            </button>
                                                            <button onClick={() => handleInvestmentRepeat(inv)} className="p-2 text-stone-400 hover:text-teal-600 bg-white border border-stone-200 rounded-lg shadow-sm hover:scale-110 transition-all" title="Repeat">
                                                                <RotateCcw size={14} />
                                                            </button>
                                                            <button onClick={() => handleInvestmentDelete(inv)} className="p-2 text-stone-400 hover:text-rose-600 bg-white border border-stone-200 rounded-lg shadow-sm hover:scale-110 transition-all">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* ── HISTORY TAB ── */}
            {activeTab === 'history' && (
                <div className="space-y-4">
                    <Card className="hidden md:block p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-stone-900 uppercase tracking-widest">Investment History</h2>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-stone-200">
                            <table className="table-standard">
                                <thead className="table-header-standard">
                                    <tr>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Funded From</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-right">Current Value</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {([...investments]).sort((a, b) => new Date(b.date) - new Date(a.date)).map((inv) => (
                                        <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-stone-900">{format(new Date(inv.date), 'MMM dd, yyyy')}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="badge-standard bg-stone-50 text-teal-600 border-stone-100">
                                                        {inv.categoryId === 'other' ? `Other (${inv.customCategoryName || ''})` : (categories.find(c => c.id === inv.categoryId)?.name || 'Unknown')}
                                                    </span>
                                                    {inv.notes && <span className="text-[10px] text-stone-400 font-bold uppercase truncate max-w-[150px]">{inv.notes}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-stone-500 font-medium italic">
                                                {cards.find(c => c.id === inv.cardId)?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-teal-600 text-lg">
                                                ${parseFloat(inv.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-stone-900">
                                                ${parseFloat(inv.currentValue ?? inv.amount ?? 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <button onClick={() => openValueModal(inv)} className="p-2 text-stone-400 hover:text-teal-600 bg-white border border-stone-200 rounded-lg shadow-sm hover:scale-110 transition-all" title="Update Value">
                                                        <RefreshCw size={14} />
                                                    </button>
                                                    <button onClick={() => handleInvestmentRepeat(inv)} className="p-2 text-stone-400 hover:text-teal-600 bg-white border border-stone-200 rounded-lg shadow-sm hover:scale-110 transition-all" title="Repeat">
                                                        <RotateCcw size={14} />
                                                    </button>
                                                    <button onClick={() => handleInvestmentEdit(inv)} className="p-2 text-stone-400 hover:text-teal-600 bg-white border border-stone-200 rounded-lg shadow-sm hover:scale-110 transition-all">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button onClick={() => handleInvestmentDelete(inv)} className="p-2 text-stone-400 hover:text-rose-600 bg-white border border-stone-200 rounded-lg shadow-sm hover:scale-110 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {investments.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-stone-400">No investment records found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile */}
                    <div className="md:hidden space-y-4">
                        {([...investments]).sort((a, b) => new Date(b.date) - new Date(a.date)).map((inv) => (
                            <Card key={inv.id} className="p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{format(new Date(inv.date), 'MMM dd, yyyy')}</p>
                                        <span className="text-sm font-black text-stone-800">
                                            {inv.categoryId === 'other' ? `Other (${inv.customCategoryName || ''})` : (categories.find(c => c.id === inv.categoryId)?.name || 'Unknown')}
                                        </span>
                                        {inv.notes && <p className="text-[10px] text-stone-500 italic">{inv.notes}</p>}
                                    </div>
                                    <span className="text-lg font-black text-teal-600">+${parseFloat(inv.amount).toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                                    <span className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                                        <CreditCard size={12} />
                                        {cards.find(c => c.id === inv.cardId)?.name || 'Unknown'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => openValueModal(inv)} className="p-2 bg-teal-50 text-teal-600 rounded-lg border border-teal-100"><RefreshCw size={14} /></button>
                                        <button onClick={() => handleInvestmentEdit(inv)} className="p-2 bg-stone-50 text-stone-600 rounded-lg border border-stone-200"><Edit3 size={14} /></button>
                                        <button onClick={() => handleInvestmentDelete(inv)} className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {investments.length === 0 && <div className="text-center py-12 text-stone-400 font-medium">No records found</div>}
                    </div>
                </div>
            )}

            {/* ── CATEGORIES TAB ── */}
            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="p-8 sticky top-8">
                            <h2 className="text-base font-bold text-stone-900 mb-6 uppercase tracking-widest">Manage Categories</h2>
                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 ml-1 uppercase tracking-widest">Category Name</label>
                                    <div className="flex gap-2">
                                        <Input
                                            required
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            placeholder="e.g. Stocks, Crypto, Real Estate"
                                            className="bg-white"
                                        />
                                        <Button type="submit" disabled={loading} className="px-4 bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                                            {editingCategory ? <Save size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-8 space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Your Categories</h3>
                                {categories.map(cat => (
                                    <div key={cat.id} className="group flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-100 hover:border-teal-600/30 hover:bg-white transition-all duration-300">
                                        <span className="font-bold text-stone-700">{cat.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }} className="p-2 text-stone-400 hover:text-teal-600 rounded-lg"><Edit3 size={14} /></button>
                                            <button onClick={() => handleCategoryDelete(cat)} className="p-2 text-stone-400 hover:text-rose-600 rounded-lg"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* ── ADD/EDIT INVESTMENT MODAL ── */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingInvestment(null); setCategoryId(''); setCustomCategoryName(''); setCardId(''); setAmount(''); setNotes(''); }}
                title={editingInvestment ? 'Edit Investment' : 'Add New Investment'}
                size="md"
            >
                <form onSubmit={handleInvestmentSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Investment Category</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <select
                                required
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-stone-900 focus:border-teal-600/50 focus:ring-4 focus:ring-teal-600/10 outline-none transition-all appearance-none text-sm font-medium"
                            >
                                <option value="">Select Category...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                <option value="other">Other</option>
                            </select>
                        </div>
                        {categoryId === 'other' && (
                            <div className="mt-4">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1 mb-1 block">Specify Category Name</label>
                                <Input required value={customCategoryName} onChange={(e) => setCustomCategoryName(e.target.value)} placeholder="e.g. Stocks, Crypto" className="bg-white" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Funding Account</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <select
                                required
                                value={cardId}
                                onChange={(e) => setCardId(e.target.value)}
                                disabled={editingInvestment}
                                className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-stone-900 outline-none transition-all disabled:opacity-50 appearance-none text-sm font-medium"
                            >
                                <option value="">Select Account...</option>
                                {cards.map(c => <option key={c.id} value={c.id}>{c.name} (${c.balance?.toLocaleString()})</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="pl-11" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
                                <Input type="number" required step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={editingInvestment} className="pl-11 bg-white font-black text-lg" placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Notes (Optional)</label>
                        <Input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a reference note..." className="bg-white" />
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-stone-100">
                        <Button type="button" onClick={() => { setIsModalOpen(false); setEditingInvestment(null); }} className="flex-1 bg-stone-100 text-stone-600 hover:bg-stone-200 border-none h-12 text-xs font-bold uppercase tracking-widest">Cancel</Button>
                        <Button type="submit" disabled={loading} className="flex-[2] bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200/50 h-12 text-xs font-bold uppercase tracking-widest">
                            {loading ? 'Processing...' : (editingInvestment ? 'Update' : 'Confirm Investment')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── UPDATE CURRENT VALUE MODAL ── */}
            <Modal
                isOpen={isValueModalOpen}
                onClose={() => { setIsValueModalOpen(false); setSelectedForUpdate(null); setNewCurrentValue(''); }}
                title="Update Market Value"
                size="sm"
            >
                <form onSubmit={handleUpdateCurrentValue} className="space-y-6">
                    <p className="text-sm text-stone-500 font-medium">
                        Enter the current market value of this investment to update your portfolio performance.
                    </p>
                    {selectedForUpdate && (
                        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-sm text-stone-600">
                            <p><span className="font-bold">Category:</span> {selectedForUpdate.categoryId === 'other' ? `Other (${selectedForUpdate.customCategoryName})` : categories.find(c => c.id === selectedForUpdate.categoryId)?.name}</p>
                            <p><span className="font-bold">Invested:</span> ${parseFloat(selectedForUpdate.amount).toLocaleString()}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Current Market Value</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
                            <Input type="number" required step="0.01" min="0" value={newCurrentValue} onChange={e => setNewCurrentValue(e.target.value)} className="pl-11 bg-white font-black text-xl" placeholder="0.00" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-stone-100">
                        <Button type="button" onClick={() => setIsValueModalOpen(false)} className="flex-1 bg-stone-100 text-stone-600 border-none h-12 text-xs font-bold uppercase tracking-widest">Cancel</Button>
                        <Button type="submit" disabled={loading} className="flex-[2] bg-teal-600 hover:bg-teal-700 h-12 text-xs font-bold uppercase tracking-widest">
                            {loading ? 'Saving...' : 'Update Value'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
