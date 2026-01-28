import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, collections } from '../services/firestore';
import { performTransfer } from '../services/transactions';
import { format } from 'date-fns';
import { ArrowRightLeft, ArrowRight, Wallet, Plus, Send, Calendar, DollarSign } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Exchange() {
    const { currentUser } = useAuth();
    const [cards, setCards] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form
    const [fromCardId, setFromCardId] = useState('');
    const [toCardId, setToCardId] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (currentUser) {
            const unsubCards = subscribeToCollection(currentUser.uid, collections.cards, (data) => {
                setCards(data.filter(c => c.isActive !== false));
            });
            const unsubTransfers = subscribeToCollection(currentUser.uid, collections.transfers, setTransfers);
            return () => { unsubCards(); unsubTransfers(); };
        }
    }, [currentUser]);

    const handleTransfer = async (e) => {
        e.preventDefault();
        if (fromCardId === toCardId) { alert("Cannot transfer to the same account"); return; }
        setLoading(true);
        try {
            await performTransfer(currentUser.uid, {
                fromCardId, toCardId,
                amount: parseFloat(amount),
                date, notes
            });
            setAmount(''); setNotes('');
            setFromCardId(''); setToCardId('');
            setIsModalOpen(false);
        } catch (error) { console.error(error); alert(error.message || "Failed"); }
        finally { setLoading(false); }
    };

    const handleAddNew = () => {
        setFromCardId('');
        setToCardId('');
        setAmount('');
        setNotes('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <ArrowRightLeft className="text-[#0067ff]" size={28} />
                        Money Transfer
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Move funds between your accounts securely.</p>
                </div>
            </div>

            {/* Transfer History - Full Width */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <ArrowRightLeft size={24} className="text-slate-400" /> Transfer History
                </h2>

                <div className="space-y-4">
                    {transfers.map((t) => (
                        <div key={t.id} className="group flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-[#0067ff]/30 hover:shadow-sm transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 group-hover:bg-white transition-colors">
                                    <ArrowRightLeft size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">Transfer</p>
                                    <p className="text-xs text-slate-500 mt-0.5 font-bold">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 md:gap-8 overflow-hidden px-4">
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-slate-500 mb-0.5">From</p>
                                    <p className="text-sm font-medium text-slate-900 truncate max-w-[100px]">
                                        {cards.find(c => c.id === t.fromCardId)?.name || '...'}
                                    </p>
                                </div>
                                <div className="text-slate-300">
                                    <ArrowRight size={16} />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-semibold text-slate-500 mb-0.5">To</p>
                                    <p className="text-sm font-medium text-slate-900 truncate max-w-[100px]">
                                        {cards.find(c => c.id === t.toCardId)?.name || '...'}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right pl-4">
                                <span className="block text-lg font-bold text-slate-900">${t.amount.toLocaleString()}</span>
                                {t.notes && <span className="text-xs text-slate-400 max-w-[150px] truncate block">{t.notes}</span>}
                            </div>
                        </div>
                    ))}

                    {transfers.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Wallet size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No transfer history yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={handleAddNew}
                className="fixed bottom-8 right-8 w-16 h-16 bg-[#0067ff] hover:bg-[#0056d6] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40"
                title="New Transfer"
            >
                <Plus size={28} />
            </button>

            {/* Transfer Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setFromCardId('');
                    setToCardId('');
                    setAmount('');
                    setNotes('');
                }}
                title="New Transfer"
                size="md"
            >
                <form onSubmit={handleTransfer} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Source Account</label>
                        <select
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm"
                            value={fromCardId}
                            onChange={(e) => setFromCardId(e.target.value)}
                        >
                            <option value="" className="bg-white text-slate-400">Select Source...</option>
                            {cards.map(c => (
                                <option key={c.id} value={c.id} className="bg-white text-slate-900">
                                    {c.name} (${c.balance})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-center -my-2 relative z-20">
                        <div className="bg-indigo-50 rounded-full p-2 border border-indigo-100 shadow-inner">
                            <ArrowRight className="text-indigo-600 transform rotate-90" size={16} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destination Account</label>
                        <select
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all text-sm appearance-none"
                            value={toCardId}
                            onChange={(e) => setToCardId(e.target.value)}
                        >
                            <option value="" className="bg-white text-slate-400">Select Destination...</option>
                            {cards.filter(c => c.id !== fromCardId).map(c => (
                                <option key={c.id} value={c.id} className="bg-white text-slate-900">
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0067ff]" size={18} />
                            <Input
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="pl-11 bg-white border-slate-200 font-bold text-lg text-slate-900 focus:ring-[#0067ff]/10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Note (Optional)</label>
                            <Input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Reference"
                                className="bg-white border-slate-200 text-slate-900 placeholder-slate-300 focus:border-[#0067ff]/50"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                        <Button type="submit" disabled={loading} className="flex-1 bg-[#0067ff] hover:bg-[#0056d6] shadow-sm transition-all h-12 text-base font-bold uppercase">
                            {loading ? 'Processing...' : 'Confirm Transfer'}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setFromCardId('');
                                setToCardId('');
                                setAmount('');
                                setNotes('');
                            }}
                            className="px-6 rounded-xl bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
