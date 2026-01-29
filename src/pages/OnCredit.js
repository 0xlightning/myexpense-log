import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateItem, subscribeToCollection, collections } from '../services/firestore';
import { addCreditTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';
import { ArrowUpRight, Calendar, DollarSign, CreditCard, Trash2, Edit3, AlertCircle, Plus, ClipboardList } from 'lucide-react';

export default function OnCredit() {
    const { currentUser } = useAuth();
    const [debts, setDebts] = useState([]);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            setIsModalOpen(false);
        } catch (error) { console.error(error); alert("Failed: " + error.message); }
        finally { setLoading(false); }
    };

    const handleEdit = (debt) => {
        setEditingDebt(debt);
        setAmount(debt.amount);
        setDate(debt.date);
        setCardId(debt.cardId);
        setNotes(debt.notes || '');
        setIsModalOpen(true);
    };

    const handleDelete = async (debt) => {
        if (window.confirm('Void this debt record?')) {
            try {
                await deleteTransaction(currentUser.uid, collections.on_credit, debt.id, debt.cardId, debt.amount, 'expense');
            } catch (error) { console.error(error); alert("Failed to delete debt"); }
        }
    };

    const handleAddNew = () => {
        setEditingDebt(null);
        setAmount('');
        setCardId('');
        setNotes('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <ArrowUpRight className="text-amber-600" size={28} />
                        On Credit
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Track pending payments and credit card usage with ease.</p>
                </div>
            </div>

            {/* Debts Table - Full Width */}
            <Card className="p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <ClipboardList size={22} className="text-slate-400" /> Credit Logs
                </h2>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="table-standard">
                        <thead className="table-header-standard">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Card Used</th>
                                <th className="px-6 py-4">Note</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {([...debts]).sort((a, b) => new Date(b.date) - new Date(a.date)).map((debt) => (
                                <tr key={debt.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-900">{format(new Date(debt.date), 'MMM dd, yyyy')}</td>
                                    <td className="px-6 py-4">
                                        <span className="badge-standard bg-amber-50 text-amber-700 border-amber-100">
                                            <CreditCard size={12} className="mr-1.5" />
                                            {cards.find(c => c.id === debt.cardId)?.name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-medium italic">
                                        {debt.notes || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-amber-600 text-lg">
                                        ${debt.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <button onClick={() => handleEdit(debt)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Edit3 size={14} /></button>
                                            <button onClick={() => handleDelete(debt)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {debts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <AlertCircle size={32} className="text-slate-300 mb-3" />
                                            <p className="font-medium">No credit records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Floating Action Button */}
            <button
                onClick={handleAddNew}
                className="fixed bottom-8 right-8 w-16 h-16 bg-[#0067ff] hover:bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40 border-4 border-white"
                title="Log Credit"
            >
                <Plus size={28} />
            </button>

            {/* OnCredit Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDebt(null);
                    setAmount('');
                    setCardId('');
                    setNotes('');
                }}
                title={editingDebt ? 'Edit Record' : 'Log New Credit Usage'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Credit Card Used</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                required
                                value={cardId}
                                onChange={(e) => setCardId(e.target.value)}
                                disabled={editingDebt}
                                className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all disabled:bg-slate-50 disabled:opacity-50 appearance-none text-sm font-medium"
                            >
                                <option value="">Select Card...</option>
                                {cards.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} (Limit: ${c.creditLimit?.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Spending Amount</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600" size={18} />
                            <Input
                                type="number"
                                required
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={editingDebt}
                                className="pl-11 bg-white font-black text-xl"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Usage Date</label>
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
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notes / Description</label>
                            <Input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="What was this for?"
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                        <Button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingDebt(null);
                                setAmount('');
                                setCardId('');
                                setNotes('');
                            }}
                            className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none h-12 text-xs font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-[2] bg-[#0067ff] hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all h-12 text-xs font-bold uppercase tracking-widest">
                            {loading ? 'Processing...' : (editingDebt ? 'Update Record' : 'Confirm Usage')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
