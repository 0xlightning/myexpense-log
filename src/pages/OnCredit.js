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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <ArrowUpRight className="text-amber-600" size={28} />
                        On Credit
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Track pending payments and credit card usage with ease.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <Card className="p-8 bg-white border border-slate-200 shadow-sm sticky top-8">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase">
                            {editingDebt ? 'Edit Record' : 'Log New Debt'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Credit Card</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        required
                                        value={cardId}
                                        onChange={(e) => setCardId(e.target.value)}
                                        disabled={editingDebt}
                                        className="w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all disabled:bg-slate-50 disabled:opacity-50 appearance-none text-sm"
                                    >
                                        <option value="" className="bg-white text-slate-400">Select Card...</option>
                                        {cards.map(c => (
                                            <option key={c.id} value={c.id} className="bg-white text-slate-900">
                                                {c.name} (Limit: ${c.creditLimit})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {cards.length === 0 && (
                                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg mt-2 border border-amber-100 leading-relaxed font-bold">
                                        <AlertCircle size={14} className="shrink-0" />
                                        <span>No active credit cards found. Please add a method first.</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600" size={18} />
                                    <Input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={editingDebt}
                                        placeholder="0.00"
                                        className="pl-11 bg-white border-slate-200 font-bold text-lg text-slate-900 focus:ring-[#0067ff]/10"
                                    />
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
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notes / Item</label>
                                <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="What did you buy?"
                                    className="bg-white border-slate-200 text-slate-900 text-sm"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={loading || cards.length === 0} className="flex-1 bg-[#0067ff] hover:bg-[#0056d6] shadow-sm transition-all h-12 text-base text-white font-bold rounded-lg uppercase">
                                    {loading ? 'Saving...' : (editingDebt ? 'Update Record' : 'Confirm Debt')}
                                </Button>
                                {editingDebt && (
                                    <Button type="button" variant="secondary" onClick={() => {
                                        setEditingDebt(null);
                                        setAmount('');
                                        setCardId('');
                                        setNotes('');
                                    }} className="px-6 rounded-lg bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200">
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <Card className="p-8 bg-white border border-slate-200 shadow-sm h-full">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-widest">Recent Unpaid Records</h2>
                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest">Description</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest">Card</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Amount</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-transparent">
                                    {debts.map((item) => (
                                        <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4 text-slate-900 font-bold">{format(new Date(item.date), 'MMM dd, yyyy')}</td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">{item.notes || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                    {cards.find(c => c.id === item.cardId)?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-amber-600">
                                                ${item.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Edit3 size={14} /></button>
                                                    <button onClick={() => handleDelete(item)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {debts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-300 uppercase tracking-[0.2em] font-bold text-xs">
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
