import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { addExpenseTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';
import { TrendingDown, Plus, Calendar, DollarSign, CreditCard, Trash2, Edit3, Save, Tag } from 'lucide-react';

export default function Expenditure() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('expense');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Data State ---
    const [categories, setCategories] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [cards, setCards] = useState([]);

    // --- Manage Expense Tab State ---
    const [categoryName, setCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    // --- Expense Tab State ---
    const [editingExpense, setEditingExpense] = useState(null);
    const [categoryId, setCategoryId] = useState('');
    const [cardId, setCardId] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        const unsubCats = subscribeToCollection(currentUser.uid, collections.expense_categories, setCategories);
        const unsubExp = subscribeToCollection(currentUser.uid, collections.expenditure_records, setExpenses);
        const unsubCards = subscribeToCollection(currentUser.uid, collections.cards, (data) => {
            setCards(data.filter(c => c.isActive !== false));
        });
        return () => { unsubCats(); unsubExp(); unsubCards(); };
    }, [currentUser]);

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = { name: categoryName };
            if (editingCategory) {
                await updateItem(currentUser.uid, collections.expense_categories, editingCategory.id, data);
                setEditingCategory(null);
            } else { await addItem(currentUser.uid, collections.expense_categories, data); }
            setCategoryName('');
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleCategoryDelete = async (cat) => {
        if (window.confirm('Delete this category?')) {
            try { await deleteItem(currentUser.uid, collections.expense_categories, cat.id); }
            catch (error) { console.error(error); }
        }
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingExpense) {
                const data = { categoryId, date };
                await updateItem(currentUser.uid, collections.expenditure_records, editingExpense.id, data);
                setEditingExpense(null);
            } else {
                await addExpenseTransaction(currentUser.uid, {
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

    const handleExpenseEdit = (expense) => {
        setEditingExpense(expense);
        setCategoryId(expense.categoryId);
        setCardId(expense.cardId);
        setDate(expense.date);
        setAmount(expense.amount);
        setIsModalOpen(true);
    };

    const handleExpenseDelete = async (expense) => {
        if (window.confirm('Delete this record? This will reverse the balance effect.')) {
            try {
                await deleteTransaction(currentUser.uid, collections.expenditure_records, expense.id, expense.cardId, expense.amount, 'expense');
            } catch (error) { console.error(error); }
        }
    };

    const handleAddNew = () => {
        setEditingExpense(null);
        setCategoryId('');
        setCardId('');
        setAmount('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <TrendingDown className="text-rose-600" size={28} />
                        Expenditure
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Log and analyze your spending behavior.</p>
                </div>
                <Tabs
                    tabs={[{ id: 'expense', label: 'History' }, { id: 'categories', label: 'Categories' }]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="w-full md:w-auto min-w-[300px]"
                />
            </div>

            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="p-6 sticky top-8 bg-white border border-slate-200 shadow-sm">
                            <h2 className="text-base font-bold text-slate-900 mb-6 uppercase tracking-widest">Manage Categories</h2>
                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-widest">Category Name</label>
                                    <div className="flex gap-2">
                                        <Input
                                            required
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            placeholder="e.g. Food, Transport"
                                            className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                                        />
                                        <Button type="submit" disabled={loading} className="px-4 bg-rose-600 hover:bg-rose-700 text-white shadow-sm">
                                            {editingCategory ? <Save size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-8 space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Your Categories</h3>
                                {categories.map(cat => (
                                    <div key={cat.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-rose-500/30 hover:bg-white transition-all">
                                        <span className="font-bold text-slate-700">{cat.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                                            <button onClick={() => handleCategoryDelete(cat)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'expense' && (
                <Card className="p-8 bg-white border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-widest">Expenditure History</h2>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px]">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-widest">Paid From</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-transparent">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4 text-slate-900 font-bold">{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-50 text-rose-600 border border-rose-100">
                                                {categories.find(c => c.id === expense.categoryId)?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            {cards.find(c => c.id === expense.cardId)?.name || 'Unknown Card'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-600">
                                            -${expense.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleExpenseEdit(expense)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Edit3 size={14} /></button>
                                                <button onClick={() => handleExpenseDelete(expense)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No expenditure records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Floating Action Button */}
            {activeTab === 'expense' && (
                <button
                    onClick={handleAddNew}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-40"
                    title="Add Expense"
                >
                    <Plus size={28} />
                </button>
            )}

            {/* Expense Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                    setCategoryId('');
                    setCardId('');
                    setAmount('');
                }}
                title={editingExpense ? 'Edit Expense' : 'Add Expense'}
                size="md"
            >
                <form onSubmit={handleExpenseSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                required
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all appearance-none text-sm"
                            >
                                <option value="" className="bg-white text-slate-400">Select Category...</option>
                                {categories.map(c => <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pay From</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                required
                                value={cardId}
                                onChange={(e) => setCardId(e.target.value)}
                                disabled={editingExpense}
                                className="w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 py-3 text-slate-900 focus:border-[#0067ff]/50 focus:ring-4 focus:ring-[#0067ff]/10 outline-none transition-all disabled:bg-slate-50 disabled:opacity-50 appearance-none text-sm"
                            >
                                <option value="" className="bg-white text-slate-400">Select Account...</option>
                                {cards.map(c => <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name} (${c.balance})</option>)}
                            </select>
                        </div>
                    </div>
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
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600" size={18} />
                            <Input
                                type="number"
                                required
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={editingExpense}
                                className="pl-11 bg-white border-slate-200 font-bold text-lg text-slate-900 focus:ring-[#0067ff]/10"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                        <Button type="submit" disabled={loading} className="flex-1 bg-rose-600 hover:bg-rose-700 shadow-sm transition-all h-12 text-base font-bold uppercase">
                            {loading ? 'Processing...' : (editingExpense ? 'Update' : 'Confirm Expense')}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingExpense(null);
                                setCategoryId('');
                                setCardId('');
                                setAmount('');
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
