import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { addExpenseTransaction, deleteTransaction } from '../services/transactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { format } from 'date-fns';
import { TrendingDown, Plus, Calendar, DollarSign, CreditCard, Trash2, Edit3, Save, Tag } from 'lucide-react';

export default function Expenditure() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('expense');
    const [loading, setLoading] = useState(false);

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
            // Don't reset category/card for rapid entry
        } catch (error) { console.error(error); alert("Failed: " + error.message); }
        finally { setLoading(false); }
    };

    const handleExpenseEdit = (exp) => {
        setEditingExpense(exp);
        setCategoryId(exp.categoryId);
        setCardId(exp.cardId);
        setDate(exp.date);
        setAmount(exp.amount);
        setActiveTab('expense');
    };

    const handleExpenseDelete = async (exp) => {
        if (window.confirm('Delete this record? Logic will reverse the balance effect.')) {
            try {
                await deleteTransaction(currentUser.uid, collections.expenditure_records, exp.id, exp.cardId, exp.amount, 'expense');
            } catch (error) { console.error(error); alert("Failed to delete expense"); }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase italic">
                        <TrendingDown className="text-rose-600" size={32} />
                        Expenditure
                    </h1>
                    <p className="text-indigo-600/70 mt-1 font-medium tracking-wide">Track where your money is going and stay in control.</p>
                </div>
                <Tabs
                    tabs={[{ id: 'expense', label: 'History & Entry' }, { id: 'manage', label: 'Categories' }]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    className="w-full md:w-auto min-w-[300px]"
                />
            </div>

            {activeTab === 'manage' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="p-6 sticky top-8 bg-white/70 border-white/40 backdrop-blur-xl shadow-xl">
                            <h2 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-widest">Manage Categories</h2>
                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-widest">Category Name</label>
                                    <div className="flex gap-2">
                                        <Input
                                            required
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            placeholder="e.g. Food, Rent"
                                            className="bg-white/50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-rose-500/20 transition-all"
                                        />
                                        <Button type="submit" disabled={loading} className="px-4 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200">
                                            {editingCategory ? <Save size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-8 space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Your Categories</h3>
                                {categories.map(cat => (
                                    <div key={cat.id} className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-rose-500/30 hover:bg-white transition-all">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-slate-400" />
                                            <span className="font-bold text-slate-700">{cat.name}</span>
                                        </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <Card className="p-8 sticky top-8 bg-white/70 border-white/40 backdrop-blur-xl shadow-xl">
                            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase italic">
                                {editingExpense ? 'Edit Expense' : 'Add Expense'}
                            </h2>
                            <form onSubmit={handleExpenseSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                                    <select
                                        required
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-slate-900 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all appearance-none"
                                    >
                                        <option value="" className="bg-white text-slate-400">Select Category...</option>
                                        {categories.map(c => <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Paid From</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select
                                            required
                                            value={cardId}
                                            onChange={(e) => setCardId(e.target.value)}
                                            disabled={editingExpense}
                                            className="w-full rounded-xl border border-slate-200 bg-white/50 pl-11 pr-4 py-3 text-slate-900 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all disabled:bg-slate-50 disabled:opacity-50 appearance-none"
                                        >
                                            <option value="" className="bg-white text-slate-400">Select Payment Method...</option>
                                            {cards.map(c => <option key={c.id} value={c.id} className="bg-white text-slate-900">{c.name} (${c.balance})</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <Input
                                            type="date"
                                            required
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="pl-11 bg-white/50 border-slate-200 text-slate-900 focus:border-rose-500/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Amount</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-600" size={18} />
                                        <Input
                                            type="number"
                                            required
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            disabled={editingExpense}
                                            className="pl-11 bg-white/80 border-slate-200 font-black text-lg text-rose-600 focus:ring-rose-500/20"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <Button type="submit" disabled={loading} className="flex-1 bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200 transition-all h-12 text-base font-black uppercase italic">
                                        {loading ? 'Processing...' : (editingExpense ? 'Update' : 'Confirm Expense')}
                                    </Button>
                                    {editingExpense && (
                                        <Button type="button" variant="secondary" onClick={() => { setEditingExpense(null); setCategoryId(''); setCardId(''); setAmount(''); }} className="px-6 rounded-xl bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 transition-all">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card className="p-8 bg-white/70 border-white/40 backdrop-blur-xl shadow-xl">
                            <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-widest italic">Expense History</h2>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Date</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Category</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Paid Via</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Amount</th>
                                            <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-transparent">
                                        {expenses.map((item) => (
                                            <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="px-6 py-4 text-slate-900 font-bold">{format(new Date(item.date), 'MMM dd, yyyy')}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">
                                                        {categories.find(c => c.id === item.categoryId)?.name || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-medium">
                                                    {cards.find(c => c.id === item.cardId)?.name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-rose-600 italic">
                                                    -${item.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleExpenseEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Edit3 size={14} /></button>
                                                        <button onClick={() => handleExpenseDelete(item)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:scale-110"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {expenses.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                    No expense records found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
