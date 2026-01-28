import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { addInvestmentTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { TrendingUp, Plus, DollarSign, CreditCard, Trash2, Edit3, Save, Briefcase, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';

export default function Investments() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('investment');
    const [loading, setLoading] = useState(false);

    // --- Data State ---
    const [categories, setCategories] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [cards, setCards] = useState([]);

    // --- Category Tab State ---
    const [categoryName, setCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    // --- Investment Tab State ---
    const [editingId, setEditingId] = useState(null);
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [cardId, setCardId] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        if (!currentUser) return;
        const unsubCats = subscribeToCollection(currentUser.uid, collections.investment_categories, setCategories);
        const unsubInv = subscribeToCollection(currentUser.uid, collections.investments, (data) => {
            setInvestments(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        });
        const unsubCards = subscribeToCollection(currentUser.uid, collections.cards, (data) => {
            setCards(data.filter(c => c.isActive !== false));
        });
        return () => { unsubCats(); unsubInv(); unsubCards(); };
    }, [currentUser]);

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { name: categoryName };
            if (editingCategory) {
                await updateItem(currentUser.uid, collections.investment_categories, editingCategory.id, data);
                setEditingCategory(null);
            } else {
                await addItem(currentUser.uid, collections.investment_categories, data);
            }
            setCategoryName('');
        } catch (error) {
            console.error(error);
            alert("Failed to save category");
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryDelete = async (cat) => {
        if (window.confirm('Delete this category?')) {
            try {
                await deleteItem(currentUser.uid, collections.investment_categories, cat.id);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                const data = { category, date };
                await updateItem(currentUser.uid, collections.investments, editingId, data);
                setEditingId(null);
            } else {
                await addInvestmentTransaction(currentUser.uid, {
                    amount: parseFloat(amount),
                    date,
                    cardId,
                    category,
                    notes: ''
                });
            }
            setAmount('');
            // Don't reset category/card for rapid entry
        } catch (error) {
            console.error("Failed to save investment:", error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (inv) => {
        setEditingId(inv.id);
        setCategory(inv.category);
        setAmount(inv.amount);
        setCardId(inv.cardId);
        setDate(inv.date);
        setActiveTab('investment');
    };

    const handleDelete = async (inv) => {
        if (window.confirm("Delete this investment? This will restore the card balance.")) {
            try {
                await deleteTransaction(currentUser.uid, collections.investments, inv.id, inv.cardId, inv.amount, 'investment');
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Failed to delete investment");
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <TrendingUp className="text-[#0067ff]" size={28} />
                        Investments
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Log your capital deployments and wealth building.</p>
                </div>
                <Tabs
                    tabs={[{ id: 'investment', label: 'History & Entry' }, { id: 'manage', label: 'Categories' }]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="w-full md:w-auto min-w-[300px]"
                />
            </div>

            {activeTab === 'manage' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="p-6 sticky top-8 bg-white border border-slate-200 shadow-sm">
                            <h2 className="text-base font-bold text-slate-900 mb-6 uppercase tracking-widest">Manage Categories</h2>
                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-widest">Category Name</label>
                                    <div className="flex gap-2">
                                        <Input
                                            required
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            placeholder="e.g. Stocks, Crypto"
                                            className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-[#0067ff]/10 transition-all"
                                        />
                                        <Button type="submit" disabled={loading} className="px-4 bg-[#0067ff] hover:bg-[#0056d6] text-white shadow-sm">
                                            {editingCategory ? <Save size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-8 space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Your Categories</h3>
                                {categories.map(cat => (
                                    <div key={cat.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#0067ff]/30 hover:bg-white transition-all">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-slate-400" />
                                            <span className="font-bold text-slate-700">{cat.name}</span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                                            <button onClick={() => handleCategoryDelete(cat)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'investment' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <Card className="p-8 sticky top-8 bg-white border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase">
                                {editingId ? 'Edit Investment' : 'Add Investment'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                    <select
                                        required
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm"
                                    >
                                        <option value="" className="bg-white text-slate-400">Select Category...</option>
                                        {categories.map(c => <option key={c.id} value={c.name} className="bg-white text-slate-900">{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Paid From</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select
                                            required
                                            value={cardId}
                                            onChange={e => setCardId(e.target.value)}
                                            disabled={editingId}
                                            className="w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all disabled:bg-slate-50 disabled:opacity-50 appearance-none text-sm"
                                        >
                                            <option value="" className="bg-white text-slate-400">Select Account...</option>
                                            {cards.map(c => (
                                                <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name} (${(c.balance || 0).toLocaleString()})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="pl-11 bg-white border-slate-200 text-slate-900 focus:border-[#0067ff]/50" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount ($)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0067ff]" size={18} />
                                        <Input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            disabled={editingId}
                                            className="pl-11 bg-white border-slate-200 text-slate-900 font-bold text-lg focus:ring-[#0067ff]/10"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <Button type="submit" disabled={loading} className="flex-1 bg-[#0067ff] hover:bg-[#0056d6] shadow-sm transition-all h-12 text-base font-bold uppercase">
                                        {loading ? 'Processing...' : (editingId ? 'Update' : 'Confirm Investment')}
                                    </Button>
                                    {editingId && (
                                        <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setCategory(''); setCardId(''); setAmount(''); }} className="px-6 rounded-xl bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 transition-all">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card className="p-8 bg-white border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-widest">Investment History</h2>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest">Category</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest">Paid From</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Amount</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-transparent">
                                        {investments.map((inv) => {
                                            const cardName = cards.find(c => c.id === inv.cardId)?.name || 'Unknown Account';
                                            return (
                                                <tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                    <td className="px-6 py-4 text-slate-900 font-bold">{format(new Date(inv.date), 'MMM dd, yyyy')}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-50 text-[#0067ff] border border-blue-100">
                                                            {inv.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 font-medium">{cardName}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-[#0067ff]">
                                                        ${(inv.amount || 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleEdit(inv)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Edit3 size={14} /></button>
                                                            <button onClick={() => handleDelete(inv)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {investments.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                    No investments logged yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
