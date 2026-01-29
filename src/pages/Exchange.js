import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, collections } from '../services/firestore';
import { performTransfer } from '../services/transactions';
import { format } from 'date-fns';
import { ArrowRightLeft, ArrowRight, Wallet, Plus, Send, Calendar, DollarSign } from 'lucide-react';
import { Card } from '../components/ui/Card';
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
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-3 uppercase">
                        <ArrowRightLeft className="text-[teal-600]" size={28} />
                        Money Transfer
                    </h1>
                    <p className="text-stone-500 mt-1 font-medium">Move funds between your accounts securely.</p>
                </div>
                <Button onClick={handleAddNew} className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200/50 px-6 h-[42px] rounded-xl flex items-center gap-2 w-full md:w-auto justify-center">
                    <Plus size={18} strokeWidth={3} />
                    <span className="font-bold uppercase text-xs tracking-wider">New Transfer</span>
                </Button>
            </div>

            {/* Transfer History - Full Width */}
            <Card className="p-8">
                <h2 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <ArrowRightLeft size={24} className="text-stone-400" /> Transfer History
                </h2>

                <div className="space-y-4">
                    {/* Desktop View */}
                    <div className="hidden md:block space-y-4">
                        {([...transfers]).sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                            <div key={t.id} className="group flex items-center justify-between p-5 rounded-2xl bg-white border border-stone-100/80 hover:border-[teal-600]/30 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 group-hover:bg-white transition-colors">
                                        <ArrowRightLeft size={22} className="text-[teal-600]" />
                                    </div>
                                    <div>
                                        <p className="font-black text-stone-900 text-sm uppercase tracking-tight">External Transfer</p>
                                        <p className="text-xs text-stone-400 mt-1 font-bold">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 md:gap-12 overflow-hidden px-4 flex-1 justify-center">
                                    <div className="text-right flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-stone-400 mb-1 uppercase tracking-widest">Source</p>
                                        <p className="text-sm font-black text-stone-800 truncate">
                                            {cards.find(c => c.id === t.fromCardId)?.name || '...'}
                                        </p>
                                    </div>
                                    <div className="bg-stone-50 p-2 rounded-full border border-stone-100 text-[teal-600]">
                                        <ArrowRight size={16} strokeWidth={3} />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-stone-400 mb-1 uppercase tracking-widest">Target</p>
                                        <p className="text-sm font-black text-stone-800 truncate">
                                            {cards.find(c => c.id === t.toCardId)?.name || '...'}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right pl-6 border-l border-stone-100">
                                    <span className="block text-xl font-black text-stone-900">${t.amount.toLocaleString()}</span>
                                    {t.notes && <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight mt-1 truncate block max-w-[150px]">{t.notes}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {([...transfers]).sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                            <div key={t.id} className="p-5 rounded-2xl bg-white border border-stone-100 shadow-sm flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-stone-400 text-xs uppercase tracking-widest mb-1">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                                        <h3 className="font-black text-stone-800 uppercase tracking-tight">Transfer</h3>
                                    </div>
                                    <span className="text-xl font-black text-[teal-600]">${t.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100/50">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">From</p>
                                        <p className="text-sm font-bold text-stone-700 truncate">{cards.find(c => c.id === t.fromCardId)?.name || '...'}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-stone-300" />
                                    <div className="flex-1 min-w-0 text-right">
                                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">To</p>
                                        <p className="text-sm font-bold text-stone-700 truncate">{cards.find(c => c.id === t.toCardId)?.name || '...'}</p>
                                    </div>
                                </div>
                                {t.notes && (
                                    <p className="text-xs text-stone-500 italic mt-1 pl-1 border-l-2 border-stone-200">
                                        {t.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {transfers.length === 0 && (
                        <div className="text-center py-24 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                            <Wallet size={48} className="mx-auto text-stone-300 mb-4" />
                            <p className="text-stone-400 font-bold uppercase tracking-[0.2em] text-[10px]">No transfer history yet</p>
                        </div>
                    )}
                </div>
            </Card>

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
                title="New Money Transfer"
                size="md"
            >
                <form onSubmit={handleTransfer} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Source Account</label>
                        <div className="relative">
                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <select
                                required
                                className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-stone-900 focus:border-[teal-600]/50 focus:ring-4 focus:ring-[teal-600]/10 outline-none transition-all appearance-none text-sm font-medium"
                                value={fromCardId}
                                onChange={(e) => setFromCardId(e.target.value)}
                            >
                                <option value="">Select Source...</option>
                                {cards.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} (${c.balance})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-center -my-2 relative z-20">
                        <div className="bg-teal-50 rounded-full p-2 border border-teal-100 shadow-sm">
                            <ArrowRight className="text-[teal-600] transform rotate-90" size={16} strokeWidth={3} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Destination Account</label>
                        <div className="relative">
                            <Send className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <select
                                required
                                className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-stone-900 focus:border-[teal-600]/50 focus:ring-4 focus:ring-[teal-600]/10 outline-none transition-all appearance-none text-sm font-medium"
                                value={toCardId}
                                onChange={(e) => setToCardId(e.target.value)}
                            >
                                <option value="">Select Destination...</option>
                                {cards.filter(c => c.id !== fromCardId).map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Transfer Amount</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[teal-600]" size={18} />
                            <Input
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="pl-11 bg-white font-black text-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Transfer Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
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
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Reference Note</label>
                            <Input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Optional"
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-stone-100">
                        <Button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setFromCardId('');
                                setToCardId('');
                                setAmount('');
                                setNotes('');
                            }}
                            className="flex-1 bg-stone-100 text-stone-600 hover:bg-stone-200 border-none h-12 text-xs font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-[2] bg-teal-600 hover:bg-teal-700 shadow-teal-200/50 transition-all h-12 text-xs font-bold uppercase tracking-widest">
                            {loading ? 'Processing...' : 'Confirm Transfer'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
