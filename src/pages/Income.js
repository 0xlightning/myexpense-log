import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { addIncomeTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';
import { TrendingUp, Plus, Calendar, DollarSign, Wallet2, Trash2, Edit3, Save, RotateCcw } from 'lucide-react';

export default function Income() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('income');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            setAmount('');
            setSourceId(''); setCardId('');
            setIsModalOpen(false);
        } catch (error) { console.error(error); alert("Failed: " + error.message); }
        finally { setLoading(false); }
    };

    const handleItemEdit = (item) => {
        setEditingItem(item);
        setSourceId(item.sourceId);
        setCardId(item.cardId);
        setDate(item.date);
        setAmount(item.amount);
        setIsModalOpen(true);
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
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setSourceId('');
        setCardId('');
        setAmount('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <TrendingUp className="text-[#0067ff]" size={28} />
                        Income
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Track your earnings and deposits with precision.</p>
                </div>
                <Tabs
                    tabs={[{ id: 'income', label: 'History' }, { id: 'manage', label: 'Sources' }]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="w-full md:w-auto min-w-[300px]"
                />
            </div>

            {activeTab === 'manage' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="p-8 sticky top-8">
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
                                            className="bg-white"
                                        />
                                        <Button type="submit" disabled={loading} className="px-4 bg-[#0067ff] hover:bg-blue-600 text-white shadow-sm">
                                            {editingSource ? <Save size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-8 space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Your Sources</h3>
                                {sources.map(source => (
                                    <div key={source.id} className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#0067ff]/30 hover:bg-white transition-all duration-300">
                                        <span className="font-bold text-slate-700">{source.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingSource(source); setSourceName(source.name); }} className="p-2 text-slate-400 hover:text-[#0067ff] hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                                            <button onClick={() => handleSourceDelete(source)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'income' && (
                <Card className="p-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-widest">Income History</h2>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="table-standard">
                            <thead className="table-header-standard">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Source</th>
                                    <th className="px-6 py-4">Deposited To</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {([...items]).sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-slate-900">{format(new Date(item.date), 'MMM dd, yyyy')}</td>
                                        <td className="px-6 py-4">
                                            <span className="badge-standard bg-emerald-50 text-emerald-600 border-emerald-100">
                                                {sources.find(s => s.id === item.sourceId)?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium italic">
                                            {cards.find(c => c.id === item.cardId)?.name || 'Unknown Card'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-600 text-lg">
                                            +${item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
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
            )}

            {/* Floating Action Button */}
            {activeTab === 'income' && (
                <button
                    onClick={handleAddNew}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40"
                    title="Add Income"
                >
                    <Plus size={28} />
                </button>
            )}

            {/* Income Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                    setSourceId('');
                    setCardId('');
                    setAmount('');
                }}
                title={editingItem ? 'Edit Income Record' : 'Add New Income'}
                size="md"
            >
                <form onSubmit={handleItemSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Source of Income</label>
                        <select
                            required
                            value={sourceId}
                            onChange={(e) => setSourceId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm font-medium"
                        >
                            <option value="">Select Source...</option>
                            {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Deposit To Account</label>
                        <div className="relative">
                            <Wallet2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                required
                                value={cardId}
                                onChange={(e) => setCardId(e.target.value)}
                                disabled={editingItem}
                                className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all disabled:bg-slate-50 disabled:opacity-50 appearance-none text-sm font-medium"
                            >
                                <option value="">Select Account...</option>
                                {cards.map(c => <option key={c.id} value={c.id}>{c.name} (${c.balance.toLocaleString()})</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Transaction Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="pl-11"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
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
                                    className="pl-11 font-black text-lg"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                        <Button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingItem(null);
                                setSourceId('');
                                setCardId('');
                                setAmount('');
                            }}
                            className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none h-12 text-xs font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-[2] bg-[#0067ff] hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all h-12 text-xs font-bold uppercase tracking-widest">
                            {loading ? 'Processing...' : (editingItem ? 'Update Record' : 'Confirm Income')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
