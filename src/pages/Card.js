import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateItem, subscribeToCollection, collections } from '../services/firestore';
import { createCard } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { CreditCard, Landmark, Banknote, ShieldCheck, Archive, Edit2, Plus } from 'lucide-react';

export default function CardPage() {
    const { currentUser } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState('bank'); // bank, cash, credit, debit
    const [initialBalance, setInitialBalance] = useState('');
    const [creditLimit, setCreditLimit] = useState('');

    // Edit Mode
    const [editingCard, setEditingCard] = useState(null);

    useEffect(() => {
        if (currentUser) {
            return subscribeToCollection(currentUser.uid, collections.cards, (data) => {
                setCards(data.filter(c => c.isActive !== false)); // Filter out archived
            });
        }
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingCard) {
                const data = {
                    name,
                    type,
                    creditLimit: type === 'credit' ? parseFloat(creditLimit) : 0
                };
                await updateItem(currentUser.uid, collections.cards, editingCard.id, data);
                setEditingCard(null);
            } else {
                await createCard(currentUser.uid, {
                    name,
                    type,
                    initialBalance: parseFloat(initialBalance) || 0,
                    creditLimit: type === 'credit' ? parseFloat(creditLimit) : 0
                });
            }
            // Reset
            setName('');
            setInitialBalance('');
            setCreditLimit('');
            setType('bank');
            setShowForm(false);
        } catch (error) {
            console.error("Error saving card:", error);
            alert("Failed to save card");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (card) => {
        setEditingCard(card);
        setName(card.name);
        setType(card.type || 'bank');
        setCreditLimit(card.creditLimit || '');
        setInitialBalance('');
        setShowForm(true);
    };

    const handleArchive = async (card) => {
        if (window.confirm('Archive this card? It will be hidden from lists but limits/history preserved.')) {
            try {
                await updateItem(currentUser.uid, collections.cards, card.id, { isActive: false });
            } catch (error) {
                console.error("Error archiving card:", error);
            }
        }
    };

    const getTypeIcon = (t) => {
        switch (t) {
            case 'credit': return <CreditCard className="text-purple-500" size={24} />;
            case 'cash': return <Banknote className="text-green-500" size={24} />;
            case 'debit': return <CreditCard className="text-blue-500" size={24} />;
            default: return <Landmark className="text-indigo-400" size={24} />;
        }
    };

    const getTypeColor = (t) => {
        switch (t) {
            case 'credit': return 'bg-purple-500/10 text-purple-600 ring-purple-500/20';
            case 'cash': return 'bg-green-500/10 text-green-600 ring-green-500/20';
            case 'debit': return 'bg-blue-500/10 text-blue-600 ring-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-600 ring-slate-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase italic">
                        <Landmark className="text-indigo-600" size={32} />
                        Payment Methods
                    </h1>
                    <p className="text-indigo-600/70 mt-1 font-medium tracking-wide">Manage your accounts, cards, and wallets with precision.</p>
                </div>
                <Button
                    onClick={() => {
                        setShowForm(!showForm);
                        if (editingCard) {
                            setEditingCard(null);
                            setName('');
                            setType('bank');
                            setCreditLimit('');
                        }
                    }}
                    className="hidden md:flex gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 px-8 shadow-xl shadow-indigo-200 transition-all font-black uppercase italic"
                    variant={showForm ? "secondary" : "default"}
                >
                    {showForm ? 'Cancel' : <><Plus size={18} /> Add Method</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                {showForm && (
                    <div className="lg:col-span-1">
                        <Card className="p-8 bg-white/70 border-white/40 backdrop-blur-xl shadow-xl sticky top-8">
                            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase italic">
                                {editingCard ? <Edit2 size={20} className="text-indigo-600" /> : <ShieldCheck size={20} className="text-indigo-600" />}
                                {editingCard ? 'Edit Method' : 'New Method'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Account Name</label>
                                    <Input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Chase Sapphire"
                                        className="bg-white/50 border-slate-200 text-slate-900 focus:ring-indigo-500/20"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Type</label>
                                    <select
                                        className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-slate-900 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="bank" className="bg-white text-slate-900">Bank Account</option>
                                        <option value="debit" className="bg-white text-slate-900">Debit Card</option>
                                        <option value="credit" className="bg-white text-slate-900">Credit Card</option>
                                        <option value="cash" className="bg-white text-slate-900">Cash / Wallet</option>
                                    </select>
                                </div>

                                {/* Initial Balance - Only for create mode */}
                                {!editingCard && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                            Initial Balance
                                        </label>
                                        <div className="relative">
                                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={initialBalance}
                                                onChange={(e) => setInitialBalance(e.target.value)}
                                                placeholder="0.00"
                                                className="pl-11 bg-white/80 border-slate-200 text-emerald-600 font-black text-lg focus:ring-emerald-500/20"
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1.5 ml-1 uppercase font-bold tracking-widest">Current amount in account</p>
                                    </div>
                                )}

                                {/* Credit Limit - Only for credit cards */}
                                {type === 'credit' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Credit Limit</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600" size={18} />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={creditLimit}
                                                onChange={(e) => setCreditLimit(e.target.value)}
                                                placeholder="e.g. 5000"
                                                className="pl-11 bg-white/80 border-slate-200 text-purple-600 font-black text-lg focus:ring-purple-500/20"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black h-12 rounded-xl shadow-xl shadow-indigo-200 transition-all uppercase italic">
                                        {loading ? 'Saving...' : (editingCard ? 'Update Method' : 'Create Method')}
                                    </Button>
                                    {editingCard && (
                                        <Button type="button" variant="secondary" onClick={() => {
                                            setEditingCard(null);
                                            setName('');
                                            setType('bank');
                                            setCreditLimit('');
                                            setShowForm(false);
                                        }} className="px-5 rounded-xl bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* List Section */}
                <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${showForm ? '2' : '3'} gap-6 auto-rows-min`}>
                    {cards.map(card => (
                        <div key={card.id} className="group relative bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 border border-white/40 shadow-xl hover:shadow-2xl hover:border-indigo-500/30 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            {/* Decorative gradient overlay */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all rounded-full -translate-y-1/2 translate-x-1/2" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div className={`p-4 rounded-2xl ${card.type === 'credit' ? 'bg-purple-50 text-purple-600' : card.type === 'cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} border border-white`}>
                                        {getTypeIcon(card.type)}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${card.type === 'credit' ? 'border-purple-200 bg-purple-50 text-purple-600' : card.type === 'cash' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-indigo-200 bg-indigo-50 text-indigo-600'}`}>
                                        {card.type}
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors uppercase italic">{card.name}</h3>

                                <div className="flex items-baseline gap-1 mb-8">
                                    <span className="text-2xl font-black text-slate-900">$</span>
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                        {(card.balance || 0).toLocaleString()}
                                    </span>
                                </div>

                                {card.type === 'credit' && (
                                    <div className="space-y-3 mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Limit Utilized</span>
                                            <span className={Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100) > 80 ? 'text-rose-600' : 'text-indigo-600'}>
                                                {Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100) > 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                                style={{ width: `${Math.min(Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100), 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <span>Avail: ${((card.creditLimit || 0) + (card.balance || 0)).toLocaleString()}</span>
                                            <span>Limit: ${card.creditLimit?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-3 md:opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <Button onClick={() => handleEdit(card)} className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border-slate-200 rounded-xl py-2 text-xs font-black uppercase tracking-widest shadow-sm">
                                        <Edit2 size={14} className="mr-2" /> Edit
                                    </Button>
                                    <Button onClick={() => handleArchive(card)} variant="secondary" className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl py-2 px-4 shadow-none transition-all">
                                        <Archive size={14} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Placeholder */}
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50 transition-all group h-full min-h-[280px]">
                            <div className="p-5 rounded-3xl bg-slate-100 group-hover:bg-indigo-600 group-hover:shadow-xl group-hover:shadow-indigo-200 transition-all mb-4">
                                <Plus size={32} className="text-slate-400 group-hover:text-white" />
                            </div>
                            <p className="font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest text-xs">Add Method</p>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
