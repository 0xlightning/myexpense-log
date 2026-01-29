import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateItem, subscribeToCollection, collections } from '../services/firestore';
import { createCard } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { CreditCard, Landmark, Banknote, Archive, Edit2, Plus } from 'lucide-react';

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


    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <Landmark className="text-[#0067ff]" size={28} />
                        Payment Methods
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your accounts, cards, and wallets with precision.</p>
                </div>
            </div>

            {/* Card Grid - Full Width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
                {cards.map(card => (
                    <Card key={card.id} className="group relative p-8 h-full flex flex-col">
                        <div className="relative z-10 flex-1">
                            <div className="flex justify-between items-start mb-8">
                                <div className={`p-4 rounded-xl ${card.type === 'credit' ? 'bg-purple-50 text-purple-600' : card.type === 'cash' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-[#0067ff]'} border border-slate-100`}>
                                    {getTypeIcon(card.type)}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${card.type === 'credit' ? 'border-purple-200 bg-purple-50 text-purple-600' : card.type === 'cash' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-[#0067ff]/20 bg-blue-50 text-[#0067ff]'}`}>
                                    {card.type}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-[#0067ff] transition-colors uppercase whitespace-nowrap overflow-hidden text-ellipsis">{card.name}</h3>

                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-xl font-bold text-slate-400">$</span>
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {(card.balance || 0).toLocaleString()}
                                </span>
                            </div>

                            {card.type === 'credit' && (
                                <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Utilized</span>
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
                                    <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                        <span>Avail: ${((card.creditLimit || 0) + (card.balance || 0)).toLocaleString()}</span>
                                        <span>Limit: ${card.creditLimit?.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-100 flex gap-3 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Button onClick={() => handleEdit(card)} className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border-slate-200 rounded-xl py-2 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                <Edit2 size={12} className="mr-2" /> Edit
                            </Button>
                            <Button onClick={() => handleArchive(card)} variant="secondary" className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl py-2 px-4 shadow-none transition-all">
                                <Archive size={14} />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={handleAddNew}
                className="fixed bottom-8 right-8 w-16 h-16 bg-[#0067ff] hover:bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40 border-4 border-white"
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account / Card Name</label>
                        <Input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Chase Sapphire, Cash Wallet"
                            className="bg-white font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Method Type</label>
                        <select
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm font-medium"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="bank" className="bg-white text-slate-900 font-medium">Bank Account</option>
                            <option value="debit" className="bg-white text-slate-900 font-medium">Debit Card</option>
                            <option value="credit" className="bg-white text-slate-900 font-medium">Credit Card</option>
                            <option value="cash" className="bg-white text-slate-900 font-medium">Cash / Wallet</option>
                        </select>
                    </div>

                    {/* Initial Balance - Only for create mode */}
                    {!editingCard && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Current Balance
                            </label>
                            <div className="relative">
                                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={initialBalance}
                                    onChange={(e) => setInitialBalance(e.target.value)}
                                    placeholder="0.00"
                                    className="pl-11 bg-white font-black text-xl"
                                />
                            </div>
                        </div>
                    )}

                    {/* Credit Limit - Only for credit cards */}
                    {type === 'credit' && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Credit Limit</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-600" size={18} />
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={creditLimit}
                                    onChange={(e) => setCreditLimit(e.target.value)}
                                    placeholder="e.g. 5000"
                                    className="pl-11 bg-white font-black text-xl"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
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
                            className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none h-12 text-xs font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-[2] bg-[#0067ff] hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all h-12 text-xs font-bold uppercase tracking-widest">
                            {loading ? 'Saving...' : (editingCard ? 'Update Method' : 'Create Method')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
