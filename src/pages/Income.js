import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { addIncomeTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { format } from 'date-fns';
import { TrendingUp, Plus, Calendar, DollarSign, Wallet2, Trash2, Edit3, Save } from 'lucide-react';

export default function Income() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('source');
    const [loading, setLoading] = useState(false);

    // --- Data State ---
    const [sources, setSources] = useState([]);
    const [items, setItems] = useState([]);
    const [cards, setCards] = useState([]);

    // --- Source Tab State ---
    const [sourceName, setSourceName] = useState('');
    const [editingSource, setEditingSource] = useState(null);

    // --- Manage Item Tab State ---
    const [editingItem, setEditingItem] = useState(null);
    const [sourceId, setSourceId] = useState('');
    const [cardId, setCardId] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const unsubSources = subscribeToCollection(currentUser.uid, collections.income_sources, setSources);
        const unsubItems = subscribeToCollection(currentUser.uid, collections.income_records, setItems);
        const unsubCards = subscribeToCollection(currentUser.uid, collections.cards, (data) => {
            setCards(data.filter(c => c.isActive !== false));
        });
        return () => { unsubSources(); unsubItems(); unsubCards(); };
    }, [currentUser]);

    const handleSourceSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { name: sourceName };
            if (editingSource) {
                await updateItem(currentUser.uid, collections.income_sources, editingSource.id, data);
                setEditingSource(null);
            } else {
                await addItem(currentUser.uid, collections.income_sources, data);
            }
            setSourceName('');
        } catch (error) { console.error(error); alert("Failed to save source"); }
        finally { setLoading(false); }
    };

    const handleSourceDelete = async (source) => {
        if (window.confirm('Delete this source?')) {
            try { await deleteItem(currentUser.uid, collections.income_sources, source.id); }
            catch (error) { console.error(error); }
        }
    };

    const handleItemSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingItem) {
                const data = { sourceId, date };
                await updateItem(currentUser.uid, collections.income_records, editingItem.id, data);
                setEditingItem(null);
            } else {
                await addIncomeTransaction(currentUser.uid, {
                    amount: parseFloat(amount),
                    date,
                    cardId,
                    sourceId,
                    notes: ''
                });
            }
            // setSourceId(''); setCardId(''); setDate(format(new Date(), 'yyyy-MM-dd')); setAmount('');
            setAmount(''); // Only clear amount for rapid entry logic if preferred, or clear all
            setSourceId(''); setCardId('');
        } catch (error) { console.error(error); alert("Failed: " + error.message); }
        finally { setLoading(false); }
    };

    const handleItemEdit = (item) => {
        setEditingItem(item);
        setSourceId(item.sourceId);
        setCardId(item.cardId);
        setDate(item.date);
        setAmount(item.amount);
        setActiveTab('manage');
    };

    const handleItemDelete = async (item) => {
        if (window.confirm('Delete this record? This will reverse the balance effect.')) {
            try {
                await deleteTransaction(currentUser.uid, collections.income_records, item.id, item.cardId, item.amount, 'income');
            } catch (error) { console.error(error); alert("Failed to delete item"); }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-emerald-400" size={32} />
                        Income
                    </h1>
                    <p className="text-emerald-300/80 mt-1 font-medium italic">Track your earnings and deposits with precision.</p>
                </div>
                <Tabs
                    tabs={[{ id: 'source', label: 'History' }, { id: 'manage', label: 'Add Entry' }]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="w-full md:w-auto min-w-[300px]"
                />
            </div>

            {activeTab === 'manage' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Source Management Card */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-8 bg-white/5 border-white/10 backdrop-blur-xl">
                            <h2 className="text-lg font-bold text-white mb-6">Manage Sources</h2>
                            <form onSubmit={handleSourceSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-indigo-300 mb-1.5 ml-1 uppercase tracking-widest">Source Name</label>
                                    <div className="flex gap-2">
                                        <Input
                                            required
                                            value={sourceName}
                                            onChange={(e) => setSourceName(e.target.value)}
                                            placeholder="e.g. Salary, Dividend"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-indigo-400/30 focus:bg-white/10"
                                        />
                                        <Button type="submit" disabled={loading} className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                                            {editingSource ? <Save size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </form>

                            <div className="mt-8 space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Your Sources</h3>
                                {sources.map(source => (
                                    <div key={source.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all">
                                        <span className="font-bold text-white/90">{source.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingSource(source); setSourceName(source.name); }} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-all"><Edit3 size={14} /></button>
                                            <button onClick={() => handleSourceDelete(source)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Transaction Entry Form */}
                    <div className="lg:col-span-2">
                        <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                {editingItem ? 'Edit Transaction' : 'Record New Income'}
                            </h2>
                            <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest ml-1">Income Source</label>
                                    <select
                                        required
                                        value={sourceId}
                                        onChange={(e) => setSourceId(e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none"
                                    >
                                        <option value="" className="bg-slate-900 text-slate-400">Select Source...</option>
                                        {sources.map(s => <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest ml-1">Deposit To</label>
                                    <div className="relative">
                                        <Wallet2 className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                                        <select
                                            required
                                            value={cardId}
                                            onChange={(e) => setCardId(e.target.value)}
                                            disabled={editingItem}
                                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-white focus:bg-white/10 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all disabled:bg-white/10 disabled:opacity-50 appearance-none"
                                        >
                                            <option value="" className="bg-slate-900 text-slate-400">Select Account...</option>
                                            {cards.map(c => <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest ml-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                                        <Input
                                            type="date"
                                            required
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="pl-11 bg-white/5 border-white/10 text-white focus:bg-white/10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest ml-1">Amount</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={18} />
                                        <Input
                                            type="number"
                                            required
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            disabled={editingItem}
                                            className="pl-11 bg-white/10 border-white/20 font-bold text-lg text-emerald-400 focus:bg-white/20"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex gap-3 mt-4">
                                    <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl text-base font-bold shadow-lg shadow-emerald-900/10 transition-all hover:-translate-y-0.5 active:scale-[0.98]">
                                        {loading ? 'Processing...' : (editingItem ? 'Update Record' : 'Confirm Deposit')}
                                    </Button>
                                    {editingItem && (
                                        <Button type="button" variant="secondary" onClick={() => { setEditingItem(null); setSourceId(''); setCardId(''); setAmount(''); }} className="px-6 rounded-xl font-semibold bg-white/5 text-slate-300 border-white/10 hover:bg-white/10">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'source' && (
                <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-extrabold text-white tracking-tight">Transaction History</h2>
                        <Button
                            onClick={() => setActiveTab('manage')}
                            className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="bg-white/20 p-1 rounded-full group-hover:rotate-90 transition-transform duration-300">
                                <Plus size={16} />
                            </div>
                            <span className="font-black uppercase tracking-[0.1em] text-xs">New Entry</span>
                        </Button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/5">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-indigo-300">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Date</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Source</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Deposited To</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Amount</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-transparent">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-white font-bold">
                                            {format(new Date(item.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">
                                                {sources.find(s => s.id === item.sourceId)?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white/70">
                                            {cards.find(c => c.id === item.cardId)?.name || 'Unknown Card'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-400">
                                            +${item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleItemEdit(item)} className="p-2 text-slate-400 hover:text-emerald-400 bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all">
                                                    <Edit3 size={14} />
                                                </button>
                                                <button onClick={() => handleItemDelete(item)} className="p-2 text-slate-400 hover:text-rose-400 bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No income records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
