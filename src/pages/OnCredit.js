import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateItem, subscribeToCollection, collections } from '../services/firestore';
import { addCreditTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { format } from 'date-fns';
import { ArrowUpRight, Calendar, DollarSign, CreditCard, Trash2, Edit3, AlertCircle } from 'lucide-react';

export default function OnCredit() {
    const { currentUser } = useAuth();
    const [debts, setDebts] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- Form State ---
    const [editingDebt, setEditingDebt] = useState(null);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [cardId, setCardId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const unsubDebts = subscribeToCollection(currentUser.uid, collections.on_credit, setDebts);
        const unsubCards = subscribeToCollection(currentUser.uid, collections.cards, (data) => {
            setCards(data.filter(c => c.isActive !== false && c.type === 'credit'));
        });
        return () => { unsubDebts(); unsubCards(); };
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingDebt) {
                const data = { date, notes };
                await updateItem(currentUser.uid, collections.on_credit, editingDebt.id, data);
                setEditingDebt(null);
            } else {
                await addCreditTransaction(currentUser.uid, {
                    amount: parseFloat(amount),
                    date,
                    cardId,
                    paymentType: 'credit',
                    notes
                });
            }
            setAmount(''); setCardId(''); setNotes(''); setDate(format(new Date(), 'yyyy-MM-dd'));
        } catch (error) { console.error(error); alert("Failed: " + error.message); }
        finally { setLoading(false); }
    };

    const handleEdit = (debt) => {
        setEditingDebt(debt);
        setAmount(debt.amount);
        setDate(debt.date);
        setCardId(debt.cardId);
        setNotes(debt.notes || '');
    };

    const handleDelete = async (debt) => {
        if (window.confirm('Void this debt record?')) {
            try {
                // Reversing credit usage (which decreases balance) means ADDING to balance => 'expense' reversal logic?
                // Actually in transactions.js:
                // Credit Usage -> newBalance = oldBalance - amount.
                // Reversal -> newBalance = oldBalance + amount.
                // Expense reversal logic adds amount back. So 'expense' type works.
                await deleteTransaction(currentUser.uid, collections.on_credit, debt.id, debt.cardId, debt.amount, 'expense');
            } catch (error) { console.error(error); alert("Failed to delete debt"); }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <ArrowUpRight className="text-amber-400" size={32} />
                        On Credit
                    </h1>
                    <p className="text-amber-300/80 mt-1 font-medium italic">Track pending payments and credit card usage with ease.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl sticky top-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            {editingDebt ? 'Edit Record' : 'Log New Debt'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest ml-1">Credit Card</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                                    <select
                                        required
                                        value={cardId}
                                        onChange={(e) => setCardId(e.target.value)}
                                        disabled={editingDebt}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-white focus:bg-white/10 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all disabled:bg-white/10 disabled:opacity-50 appearance-none"
                                    >
                                        <option value="" className="bg-slate-900 text-indigo-300">Select Card...</option>
                                        {cards.map(c => (
                                            <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                                                {c.name} (Limit: ${c.creditLimit})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {cards.length === 0 && (
                                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl mt-2 border border-amber-500/20 leading-relaxed">
                                        <AlertCircle size={14} className="shrink-0" />
                                        <span>No active credit cards found. Please add a method first.</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest ml-1">Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                                    <Input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={editingDebt}
                                        placeholder="0.00"
                                        className="pl-11 bg-white/10 border-white/20 font-bold text-lg text-amber-400 focus:bg-white/20"
                                    />
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
                                <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest ml-1">Notes / Item</label>
                                <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="What did you buy?"
                                    className="bg-white/5 border-white/10 text-white focus:bg-white/10"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={loading || cards.length === 0} className="flex-1 bg-amber-500 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 transition-all h-12 text-base text-white font-bold rounded-xl">
                                    {loading ? 'Saving...' : (editingDebt ? 'Update Record' : 'Confirm Debt')}
                                </Button>
                                {editingDebt && (
                                    <Button type="button" variant="secondary" onClick={() => {
                                        setEditingDebt(null);
                                        setAmount('');
                                        setCardId('');
                                        setNotes('');
                                    }} className="px-6 rounded-xl bg-white/5 text-indigo-300 border-white/10 hover:bg-white/10">
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-xl h-full">
                        <h2 className="text-xl font-bold text-white mb-6">Recent Unpaid Records</h2>
                        <div className="overflow-hidden rounded-xl border border-white/5">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-indigo-300">
                                    <tr>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Date</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Description</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Card</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Amount</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-transparent">
                                    {debts.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 text-white font-bold">{format(new Date(item.date), 'MMM dd, yyyy')}</td>
                                            <td className="px-6 py-4 text-white/70">{item.notes || '-'}</td>
                                            <td className="px-6 py-4 text-slate-300">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-white/5">
                                                    {cards.find(c => c.id === item.cardId)?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-amber-400">
                                                ${item.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(item)} className="p-2 text-indigo-300 hover:text-indigo-400 bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all"><Edit3 size={14} /></button>
                                                    <button onClick={() => handleDelete(item)} className="p-2 text-rose-300 hover:text-rose-400 bg-white/5 border border-transparent hover:border-white/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {debts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-indigo-300/30 uppercase tracking-[0.2em] font-black text-xs italic">
                                                No debt records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
