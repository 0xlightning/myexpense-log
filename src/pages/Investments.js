import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { addInvestmentTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { TrendingUp, Plus, DollarSign, Wallet, Trash2, Edit3, Save, Briefcase, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function Investments() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [investments, setInvestments] = useState([]);
    const [cards, setCards] = useState([]);

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [cardId, setCardId] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        if (!currentUser) return;
        const unsubInv = subscribeToCollection(currentUser.uid, collections.investments, (data) => {
            setInvestments(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        });
        const unsubCards = subscribeToCollection(currentUser.uid, collections.cards, (data) => {
            setCards(data.filter(c => c.isActive !== false));
        });
        return () => { unsubInv(); unsubCards(); };
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                const data = {
                    category,
                    date
                };
                await updateItem(currentUser.uid, collections.investments, editingId, data);
            } else {
                await addInvestmentTransaction(currentUser.uid, {
                    amount: parseFloat(amount),
                    date,
                    cardId,
                    category,
                    notes: ''
                });
            }

            resetForm();
        } catch (error) {
            console.error("Failed to save investment:", error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setCategory('');
        setAmount('');
        setCardId('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const handleEdit = (inv) => {
        // Edit is limited to metadata once balance effect is done
        setEditingId(inv.id);
        setCategory(inv.category);
        setAmount(inv.amount);
        setCardId(inv.cardId);
        setDate(inv.date);
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
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                    <TrendingUp className="text-[#0067ff]" size={28} />
                    Investments
                </h1>
                <p className="text-slate-500 mt-1 font-medium italic">Log your capital deployments and wealth building.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1">
                    <Card className="p-8 sticky top-8 bg-white border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase">
                            {editingId ? 'Edit Record' : 'Log Investment'}
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
                                    <option value="" className="bg-white text-slate-400">Select...</option>
                                    <option value="Stocks" className="bg-white text-slate-900">Stocks</option>
                                    <option value="Mutual Funds" className="bg-white text-slate-900">Mutual Funds</option>
                                    <option value="Crypto" className="bg-white text-slate-900">Crypto</option>
                                    <option value="Real Estate" className="bg-white text-slate-900">Real Estate</option>
                                    <option value="Bonds" className="bg-white text-slate-900">Bonds</option>
                                    <option value="SIP" className="bg-white text-slate-900">SIP</option>
                                    <option value="Other" className="bg-white text-slate-900">Other</option>
                                </select>
                            </div>

                            {!editingId && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount ($)</label>
                                        <Input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="bg-white border-slate-200 text-slate-900 text-sm font-bold" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Paid From</label>
                                        <select
                                            required
                                            value={cardId}
                                            onChange={e => setCardId(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm"
                                        >
                                            <option value="">Select Account...</option>
                                            {cards.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} (${(c.balance || 0).toLocaleString()})</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white border-slate-200 text-slate-900" />
                            </div>

                            <div className="flex gap-3 mt-4">
                                <Button type="submit" disabled={loading} className="flex-1 bg-[#0067ff] hover:bg-[#0056d6] shadow-sm transition-all h-12 text-base font-bold uppercase">
                                    {editingId ? ' Update Record' : ' Log Investment'}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="secondary" onClick={resetForm} className="px-6 rounded-lg bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200">Cancel</Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <Card className="p-8 bg-white border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-widest">Investment History</h2>
                        <div className="space-y-4">
                            {investments.map(inv => {
                                const cardName = cards.find(c => c.id === inv.cardId)?.name || 'Unknown Account';
                                return (
                                    <div key={inv.id} className="flex items-center justify-between p-5 rounded-xl bg-white border border-slate-100 group transition-all hover:shadow-md hover:border-[#0067ff]/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0067ff] shadow-inner">
                                                <Briefcase size={22} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">{inv.category}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <CreditCard size={12} className="text-slate-400" />
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{cardName}</p>
                                                    <span className="text-slate-300">•</span>
                                                    <Calendar size={12} className="text-slate-400" />
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{inv.date}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-slate-900 tracking-tight">${(inv.amount || 0).toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-[#0067ff] uppercase tracking-widest">Capital Inflow</p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transition-transform translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => handleEdit(inv)} className="p-2 text-slate-400 hover:text-[#0067ff] bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Edit3 size={16} /></button>
                                                <button onClick={() => handleDelete(inv)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {investments.length === 0 && (
                                <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">No investments logged yet.</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
