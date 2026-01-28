import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { addIncomeTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { format } from 'date-fns';
import { TrendingUp, Plus, Calendar, DollarSign, Wallet2, Trash2, Edit3, Save, RotateCcw } from 'lucide-react';

export default function Income() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('income');
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

    const handleItemRepeat = (item) => {
        setEditingItem(null);
        setSourceId(item.sourceId);
        setCardId(item.cardId);
        setAmount(item.amount);
        setDate(format(new Date(), 'yyyy-MM-dd'));
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <TrendingUp className="text-emerald-600" size={28} />
                        Income
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Track your earnings and deposits with precision.</p>
                </div>
                <Tabs
                    tabs={[{ id: 'income', label: 'History & Entry' }, { id: 'manage', label: 'Sources' }]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="w-full md:w-auto min-w-[300px]"
                />
            </div>

            {activeTab === 'manage' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="p-6 sticky top-8 bg-white border border-slate-200 shadow-sm">
                            <h2 className="text-base font-bold text-slate-900 mb-6 uppercase tracking-widest">Manage Sources</h2>
                            <form onSubmit={handleSourceSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-widest">Source Name</label>
                                    <div className="flex gap-2">
                                        <Input
                                            required
                                            value={sourceName}
                                            onChange={(e) => setSourceName(e.target.value)}
                                            placeholder="e.g. Salary, Dividend"
                                            className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-[#0067ff]/10 transition-all"
                                        />
                                        <Button type="submit" disabled={loading} className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                                            {editingSource ? <Save size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-8 space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Your Sources</h3>
                                {sources.map(source => (
                                    <div key={source.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-500/30 hover:bg-white transition-all">
                                        <span className="font-bold text-slate-700">{source.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingSource(source); setSourceName(source.name); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                                            <button onClick={() => handleSourceDelete(source)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'income' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <Card className="p-8 sticky top-8 bg-white border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase">
                                {editingItem ? 'Edit Income' : 'Add Income'}
                            </h2>
                            <form onSubmit={handleItemSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Source</label>
                                    <select
                                        required
                                        value={sourceId}
                                        onChange={(e) => setSourceId(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm"
                                    >
                                        <option value="" className="bg-white text-slate-400">Select Source...</option>
                                        {sources.map(s => <option key={s.id} value={s.id} className="bg-white text-slate-900">{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Deposit To</label>
                                    <div className="relative">
                                        <Wallet2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select
                                            required
                                            value={cardId}
                                            onChange={(e) => setCardId(e.target.value)}
                                            disabled={editingItem}
                                            className="w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all disabled:bg-slate-50 disabled:opacity-50 appearance-none text-sm"
                                        >
                                            <option value="" className="bg-white text-slate-400">Select Account...</option>
                                            {cards.map(c => <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name} (${c.balance})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <Input
                                            type="date"
                                            required
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="pl-11 bg-white border-slate-200 text-slate-900 focus:border-[#0067ff]/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                                        <Input
                                            type="number"
                                            required
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            disabled={editingItem}
                                            className="pl-11 bg-white border-slate-200 font-bold text-lg text-slate-900 focus:ring-[#0067ff]/10"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <Button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all h-12 text-base font-bold uppercase">
                                        {loading ? 'Processing...' : (editingItem ? 'Update' : 'Confirm Income')}
                                    </Button>
                                    {editingItem && (
                                        <Button type="button" variant="secondary" onClick={() => { setEditingItem(null); setSourceId(''); setCardId(''); setAmount(''); }} className="px-6 rounded-xl bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 transition-all">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card className="p-8 bg-white border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-widest">Income History</h2>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest">Source</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest">Deposited To</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Amount</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-transparent">
                                        {items.map((item) => (
                                            <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="px-6 py-4 text-slate-900 font-bold">{format(new Date(item.date), 'MMM dd, yyyy')}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        {sources.find(s => s.id === item.sourceId)?.name || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-medium">
                                                    {cards.find(c => c.id === item.cardId)?.name || 'Unknown Card'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                    +${item.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleItemRepeat(item)} className="p-2 text-slate-400 hover:text-[#0067ff] bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110" title="Repeat Payment"><RotateCcw size={14} /></button>
                                                        <button onClick={() => handleItemEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Edit3 size={14} /></button>
                                                        <button onClick={() => handleItemDelete(item)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Trash2 size={14} /></button>
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
                    </div>
                </div>
            )}
        </div>
    );
}
