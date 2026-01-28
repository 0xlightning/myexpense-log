import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, collections } from '../services/firestore';
import { performTransfer } from '../services/transactions';
import { format } from 'date-fns';
import { ArrowRightLeft, ArrowRight, Wallet, History, Send } from 'lucide-react';

export default function Exchange() {
    const { currentUser } = useAuth();
    const [cards, setCards] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(false);

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
        } catch (error) { console.error(error); alert(error.message || "Failed"); }
        finally { setLoading(false); }
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transfer Form - Styled as a "Card" visual */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 sticky top-8 relative overflow-hidden">
                        <h2 className="text-lg font-bold text-slate-900 mb-8 relative z-10 flex items-center gap-2 uppercase">
                            <Send size={20} className="text-[#0067ff]" /> Transfer Details
                        </h2>

                        <form onSubmit={handleTransfer} className="space-y-6 relative z-10">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Source Account</label>
                                    <select
                                        required
                                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm"
                                        value={fromCardId}
                                        onChange={(e) => setFromCardId(e.target.value)}
                                        style={{ backgroundImage: 'none' }}
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

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Destination Account</label>
                                    <select
                                        required
                                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all text-sm"
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
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-light text-xl">$</span>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-transparent border-0 text-3xl font-bold text-slate-900 placeholder-slate-200 focus:ring-0 px-8 py-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0067ff]/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Ref/Note</label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Optional"
                                        className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none placeholder-slate-300 focus:border-[#0067ff]/50"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4 bg-[#0067ff] text-white font-bold rounded-lg shadow-sm hover:bg-[#0056d6] transition-all transform active:scale-95 uppercase">
                                {loading ? 'Processing...' : 'Confirm Transfer'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* History */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 h-full">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <History size={24} className="text-slate-400" /> Recent Transfers
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
                </div>
            </div>
        </div>
    );
}
