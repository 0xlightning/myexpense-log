import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { addInvestmentTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';
import { Briefcase, Plus, Calendar, DollarSign, CreditCard, Trash2, Edit3, Save, Tag, RotateCcw } from 'lucide-react';

export default function Investments() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('investment');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Data State ---
    const [categories, setCategories] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [cards, setCards] = useState([]);

    // --- Category Tab State ---
    const [categoryName, setCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    // --- Investment Tab State ---
    const [editingInvestment, setEditingInvestment] = useState(null);
    const [categoryId, setCategoryId] = useState('');
    const [cardId, setCardId] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const unsubCats = subscribeToCollection(currentUser.uid, collections.investment_categories, setCategories);
        const unsubInv = subscribeToCollection(currentUser.uid, collections.investments, setInvestments);
        const unsubCards = subscribeToCollection(currentUser.uid, collections.cards, (data) => {
            setCards(data.filter(c => c.isActive !== false));
        });
        return () => { unsubCats(); unsubInv(); unsubCards(); };
    }, [currentUser]);

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { name: categoryName };
            if (editingCategory) {
                await updateItem(currentUser.uid, collections.investment_categories, editingCategory.id, data);
                setEditingCategory(null);
            } else { await addItem(currentUser.uid, collections.investment_categories, data); }
            setCategoryName('');
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleCategoryDelete = async (cat) => {
        if (window.confirm('Delete this category?')) {
            try { await deleteItem(currentUser.uid, collections.investment_categories, cat.id); }
            catch (error) { console.error(error); }
        }
    };

    const handleInvestmentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingInvestment) {
                const data = { categoryId, date };
                await updateItem(currentUser.uid, collections.investments, editingInvestment.id, data);
                setEditingInvestment(null);
            } else {
                await addInvestmentTransaction(currentUser.uid, {
                    amount: parseFloat(amount),
                    date,
                    cardId,
                    categoryId,
                    notes: ''
                });
            }
            setAmount('');
            setCategoryId(''); setCardId('');
            setIsModalOpen(false);
        } catch (error) { console.error(error); alert('Failed: ' + error.message); }
        finally { setLoading(false); }
    };

    const handleInvestmentEdit = (investment) => {
        setEditingInvestment(investment);
        setCategoryId(investment.categoryId);
        setCardId(investment.cardId);
        setDate(investment.date);
        setAmount(investment.amount);
        setIsModalOpen(true);
    };

    const handleInvestmentDelete = async (investment) => {
        if (window.confirm('Delete this record? This will reverse the balance effect.')) {
            try {
                await deleteTransaction(currentUser.uid, collections.investments, investment.id, investment.cardId, investment.amount, 'investment');
            } catch (error) { console.error(error); }
        }
    };

    const handleInvestmentRepeat = (investment) => {
        setEditingInvestment(null);
        setCategoryId(investment.categoryId);
        setCardId(investment.cardId);
        setAmount(investment.amount);
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingInvestment(null);
        setCategoryId('');
        setCardId('');
        setAmount('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <Briefcase className="text-[#0067ff]" size={28} />
                        Investments
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Track your investment transactions and portfolio.</p>
                </div>
                <Tabs
                    tabs={[{ id: 'investment', label: 'History' }, { id: 'categories', label: 'Categories' }]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="w-full md:w-auto min-w-[300px]"
                />
            </div>

            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="p-8 sticky top-8">
                            <h2 className="text-base font-bold text-slate-900 mb-6 uppercase tracking-widest">Manage Categories</h2>
                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-widest">Category Name</label>
                                    <div className="flex gap-2">
                                        <Input
                                            required
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            placeholder="e.g. Stocks, Crypto, Real Estate"
                                            className="bg-white"
                                        />
                                        <Button type="submit" disabled={loading} className="px-4 bg-[#0067ff] hover:bg-blue-600 text-white shadow-sm">
                                            {editingCategory ? <Save size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-8 space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Your Categories</h3>
                                {categories.map(cat => (
                                    <div key={cat.id} className="group flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#0067ff]/30 hover:bg-white transition-all duration-300">
                                        <span className="font-bold text-slate-700">{cat.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                                            <button onClick={() => handleCategoryDelete(cat)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'investment' && (
                <Card className="p-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-widest">Investment History</h2>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="table-standard">
                            <thead className="table-header-standard">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Paid From</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {([...investments]).sort((a, b) => new Date(b.date) - new Date(a.date)).map((investment) => (
                                    <tr key={investment.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-slate-900">{format(new Date(investment.date), 'MMM dd, yyyy')}</td>
                                        <td className="px-6 py-4">
                                            <span className="badge-standard bg-blue-50 text-[#0067ff] border-blue-100">
                                                {categories.find(c => c.id === investment.categoryId)?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium italic">
                                            {cards.find(c => c.id === investment.cardId)?.name || 'Unknown Card'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-[#0067ff] text-lg">
                                            +${investment.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <button onClick={() => handleInvestmentRepeat(investment)} className="p-2 text-slate-400 hover:text-[#0067ff] bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110" title="Repeat Investment"><RotateCcw size={14} /></button>
                                                <button onClick={() => handleInvestmentEdit(investment)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Edit3 size={14} /></button>
                                                <button onClick={() => handleInvestmentDelete(investment)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {investments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No investment records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Floating Action Button */}
            {activeTab === 'investment' && (
                <button
                    onClick={handleAddNew}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-[#0067ff] hover:bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40 border-4 border-white"
                    title="Add Investment"
                >
                    <Plus size={28} />
                </button>
            )}

            {/* Investment Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingInvestment(null);
                    setCategoryId('');
                    setCardId('');
                    setAmount('');
                }}
                title={editingInvestment ? 'Edit Investment' : 'Add New Investment'}
                size="md"
            >
                <form onSubmit={handleInvestmentSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Investment Category</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                required
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm font-medium"
                            >
                                <option value="">Select Category...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Funding Account</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                required
                                value={cardId}
                                onChange={(e) => setCardId(e.target.value)}
                                disabled={editingInvestment}
                                className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all disabled:bg-slate-50 disabled:opacity-50 appearance-none text-sm font-medium"
                            >
                                <option value="">Select Account...</option>
                                {cards.map(c => <option key={c.id} value={c.id}>{c.name} (${c.balance})</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Investment Date</label>
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
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0067ff]" size={18} />
                                <Input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={editingInvestment}
                                    className="pl-11 bg-white font-black text-xl"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                        <Button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingInvestment(null);
                                setCategoryId('');
                                setCardId('');
                                setAmount('');
                            }}
                            className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none h-12 text-xs font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-[2] bg-[#0067ff] hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all h-12 text-xs font-bold uppercase tracking-widest">
                            {loading ? 'Processing...' : (editingInvestment ? 'Update' : 'Confirm Investment')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
