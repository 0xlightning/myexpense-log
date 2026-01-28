import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateItem, subscribeToCollection, collections } from '../services/firestore';
import { createCard } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { CreditCard, Landmark, Banknote, ShieldCheck, Archive, Edit2, Plus } from 'lucide-react';

export default function CardPage() {
    const { currentUser } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            setIsModalOpen(false);
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
        setIsModalOpen(true);
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

    const handleAddNew = () => {
        setEditingCard(null);
        setName('');
        setType('bank');
        setCreditLimit('');
        setInitialBalance('');
        setIsModalOpen(true);
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <Landmark className="text-indigo-600" size={28} />
                        Payment Methods
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your accounts, cards, and wallets with precision.</p>
                </div>
            </div>

            {/* Card Grid - Full Width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
                {cards.map(card => (
                    <div key={card.id} className="group relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md hover:border-[#0067ff]/30 transition-all duration-300 overflow-hidden">
                        {/* Decorative gradient overlay */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all rounded-full -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-10">
                                <div className={`p-4 rounded-xl ${card.type === 'credit' ? 'bg-purple-50 text-purple-600' : card.type === 'cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} border border-slate-100`}>
                                    {getTypeIcon(card.type)}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${card.type === 'credit' ? 'border-purple-200 bg-purple-50 text-purple-600' : card.type === 'cash' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-indigo-200 bg-indigo-50 text-indigo-600'}`}>
                                    {card.type}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight group-hover:text-[#0067ff] transition-colors uppercase">{card.name}</h3>

                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-2xl font-bold text-slate-900">$</span>
                                <span className="text-4xl font-bold text-slate-900 tracking-tighter">
                                    {(card.balance || 0).toLocaleString()}
                                </span>
                            </div>

                            {card.type === 'credit' && (
                                <div className="space-y-3 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Limit Utilized</span>
                                        <span className={Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100) > 80 ? 'text-rose-600' : 'text-[#0067ff]'}>
                                            {Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100) > 80 ? 'bg-rose-500' : 'bg-[#0067ff]'}`}
                                            style={{ width: `${Math.min(Math.abs(((card.balance || 0) / (card.creditLimit || 1)) * 100), 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        <span>Avail: ${((card.creditLimit || 0) + (card.balance || 0)).toLocaleString()}</span>
                                        <span>Limit: ${card.creditLimit?.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3 md:opacity-0 group-hover:opacity-100 transition-all">
                                <Button onClick={() => handleEdit(card)} className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border-slate-200 rounded-lg py-2 text-xs font-bold uppercase tracking-widest shadow-sm">
                                    <Edit2 size={14} className="mr-2" /> Edit
                                </Button>
                                <Button onClick={() => handleArchive(card)} variant="secondary" className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg py-2 px-4 shadow-none transition-all">
                                    <Archive size={14} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={handleAddNew}
                className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40"
                title="Add Payment Method"
            >
                <Plus size={28} />
            </button>

            {/* Card Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCard(null);
                    setName('');
                    setType('bank');
                    setCreditLimit('');
                    setInitialBalance('');
                }}
                title={editingCard ? 'Edit Payment Method' : 'New Payment Method'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
                        <Input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Chase Sapphire"
                            className="bg-white border-slate-200 text-slate-900 focus:ring-[#0067ff]/10"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type</label>
                        <select
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm"
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
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
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
                                    className="pl-11 bg-white border-slate-200 text-slate-900 font-bold text-lg focus:ring-[#0067ff]/10"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 ml-1 uppercase font-bold tracking-widest">Current amount in account</p>
                        </div>
                    )}

                    {/* Credit Limit - Only for credit cards */}
                    {type === 'credit' && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Credit Limit</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600" size={18} />
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={creditLimit}
                                    onChange={(e) => setCreditLimit(e.target.value)}
                                    placeholder="e.g. 5000"
                                    className="pl-11 bg-white border-slate-200 text-slate-900 font-bold text-lg focus:ring-[#0067ff]/10"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                        <Button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-lg shadow-sm transition-all uppercase">
                            {loading ? 'Saving...' : (editingCard ? 'Update Method' : 'Create Method')}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingCard(null);
                                setName('');
                                setType('bank');
                                setCreditLimit('');
                                setInitialBalance('');
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
