import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateItem, subscribeToCollection, collections } from '../services/firestore';
import { createCard } from '../services/transactions';
import { Button } from '../components/ui/Button';
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
            default: return <Landmark className="text-slate-500" size={24} />;
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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payment Methods</h1>
                    <p className="text-slate-500 mt-1">Manage your accounts, cards, and wallets.</p>
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
                    className="hidden md:flex gap-2"
                    variant={showForm ? "secondary" : "default"}
                >
                    {showForm ? 'Cancel' : <><Plus size={18} /> Add Method</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                {showForm && (
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-8">
                            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                {editingCard ? <Edit2 size={20} className="text-violet-500" /> : <ShieldCheck size={20} className="text-violet-500" />}
                                {editingCard ? 'Edit Method' : 'Add New Method'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Account Name</label>
                                    <Input
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Chase Sapphire"
                                        className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Type</label>
                                    <select
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all outline-none"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="bank">Bank Account</option>
                                        <option value="debit">Debit Card</option>
                                        <option value="credit">Credit Card</option>
                                        <option value="cash">Cash / Wallet</option>
                                    </select>
                                </div>

                                {/* Initial Balance - Only for create mode */}
                                {!editingCard && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                                            Initial Balance
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={initialBalance}
                                                onChange={(e) => setInitialBalance(e.target.value)}
                                                placeholder="0.00"
                                                className="pl-8 bg-slate-50 border-slate-200 focus:bg-white"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1.5 ml-1">Current amount in account</p>
                                    </div>
                                )}

                                {/* Credit Limit - Only for credit cards */}
                                {type === 'credit' && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Credit Limit</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={creditLimit}
                                                onChange={(e) => setCreditLimit(e.target.value)}
                                                placeholder="e.g. 5000"
                                                className="pl-8 bg-slate-50 border-slate-200 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-violet-500/30 transition-all">
                                        {loading ? 'Saving...' : (editingCard ? 'Update Method' : 'Create Method')}
                                    </Button>
                                    {editingCard && (
                                        <Button type="button" variant="secondary" onClick={() => {
                                            setEditingCard(null);
                                            setName('');
                                            setType('bank');
                                            setCreditLimit('');
                                            setShowForm(false);
                                        }} className="px-5">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* List Section */}
                <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${showForm ? '2' : '3'} gap-5 auto-rows-min`}>
                    {cards.map(card => (
                        <div key={card.id} className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-violet-100 hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3.5 rounded-2xl shadow-inner ${card.type === 'credit' ? 'bg-purple-50' : card.type === 'cash' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                                    {getTypeIcon(card.type)}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ${getTypeColor(card.type)}`}>
                                    {card.type}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors mb-1">{card.name}</h3>

                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-sm text-slate-400 font-medium">$</span>
                                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {(card.balance || 0).toLocaleString()}
                                </span>
                            </div>

                            {card.type === 'credit' && (
                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                                        <span>Limit Used</span>
                                        <span>{Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                            style={{ width: `${Math.min(Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100), 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Aval: ${((card.creditLimit || 0) + (card.balance || 0)).toLocaleString()}</span>
                                        <span>Limit: ${card.creditLimit?.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => handleEdit(card)} className="p-2 bg-white text-slate-600 hover:text-violet-600 rounded-lg shadow-sm border border-slate-200 hover:border-violet-200 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleArchive(card)} className="p-2 bg-white text-slate-600 hover:text-red-600 rounded-lg shadow-sm border border-slate-200 hover:border-red-200 transition-colors">
                                    <Archive size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add New Placeholder */}
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all group h-full min-h-[240px]">
                            <div className="p-4 rounded-full bg-slate-50 group-hover:bg-violet-100 transition-colors mb-3">
                                <Plus size={24} className="text-slate-400 group-hover:text-violet-600" />
                            </div>
                            <p className="font-semibold text-slate-500 group-hover:text-violet-700">Add New Method</p>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
