import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { TrendingUp, Plus, DollarSign, Wallet, Trash2, Edit3, Save, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

export default function Investments() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [investments, setInvestments] = useState([]);

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [initialAmount, setInitialAmount] = useState('');
    const [currentValue, setCurrentValue] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        if (!currentUser) return;
        return subscribeToCollection(currentUser.uid, collections.investments, setInvestments);
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                name,
                category,
                initialAmount: parseFloat(initialAmount),
                currentValue: parseFloat(currentValue),
                date
            };

            if (editingId) {
                await updateItem(currentUser.uid, collections.investments, editingId, data);
            } else {
                await addItem(currentUser.uid, collections.investments, data);
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
        setName('');
        setCategory('');
        setInitialAmount('');
        setCurrentValue('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
    };

    const handleEdit = (inv) => {
        setEditingId(inv.id);
        setName(inv.name);
        setCategory(inv.category);
        setInitialAmount(inv.initialAmount);
        setCurrentValue(inv.currentValue);
        setDate(inv.date);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this investment?")) {
            try {
                await deleteItem(currentUser.uid, collections.investments, id);
            } catch (error) {
                console.error("Delete failed:", error);
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-indigo-400" size={32} />
                    Investments
                </h1>
                <p className="text-slate-400 mt-1">Track your assets and portfolio growth.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1">
                    <Card className="p-8 sticky top-8 border-white/10 bg-white/5 backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            {editingId ? 'Edit Investment' : 'New Investment'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Asset Name</label>
                                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BTC, Apple Stock" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:bg-white/10" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                                <select
                                    required
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/20 outline-none focus:bg-white/10 transition-all appearance-none"
                                >
                                    <option value="" className="bg-slate-900">Select...</option>
                                    <option value="Crypto" className="bg-slate-900">Crypto</option>
                                    <option value="Stocks" className="bg-slate-900">Stocks</option>
                                    <option value="Real Estate" className="bg-slate-900">Real Estate</option>
                                    <option value="Bonds" className="bg-slate-900">Bonds</option>
                                    <option value="Other" className="bg-slate-900">Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Initial ($)</label>
                                    <Input required type="number" step="0.01" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} className="bg-white/5 border-white/10 text-white focus:bg-white/10" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Current ($)</label>
                                    <Input required type="number" step="0.01" value={currentValue} onChange={e => setCurrentValue(e.target.value)} className="bg-white/5 border-white/10 text-white focus:bg-white/10" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Date</label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white/5 border-white/10 text-white focus:bg-white/10" />
                            </div>
                            <div className="flex gap-3">
                                <Button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {editingId ? <Save size={18} /> : <Plus size={18} />}
                                    {editingId ? ' Update' : ' Add'}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <Card className="p-8 border-white/10 bg-white/5 backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white mb-6 font-bold">Asset Portfolio</h2>
                        <div className="space-y-4">
                            {investments.map(inv => {
                                const gain = inv.currentValue - inv.initialAmount;
                                const isProfit = gain >= 0;
                                return (
                                    <div key={inv.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group transition-all hover:bg-white/10 hover:border-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-center text-indigo-400">
                                                <Briefcase size={22} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{inv.name}</h3>
                                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{inv.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-white">${inv.currentValue.toLocaleString()}</p>
                                            <p className={`text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {isProfit ? '+' : ''}${gain.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-6">
                                            <button onClick={() => handleEdit(inv)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(inv.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                            {investments.length === 0 && (
                                <div className="text-center py-12 text-slate-400 font-medium">No investments tracked yet.</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
