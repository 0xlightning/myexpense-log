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
import { TrendingDown, Plus, Calendar, DollarSign, CreditCard, Trash2, Edit3, Save, Tag, RotateCcw } from 'lucide-react';

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

    const handleExpenseRepeat = (expense) => {
        setEditingExpense(null);
        setCategoryId(expense.categoryId);
        setCardId(expense.cardId);
        setAmount(expense.amount);
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setIsModalOpen(true);
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
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-3 uppercase">
                        <TrendingDown className="text-orange-600" size={28} />
                        Expenditure
                    </h1>
                    <p className="text-stone-500 mt-1 font-medium">Log and analyze your spending behavior.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Tabs
                        tabs={[{ id: 'expense', label: 'History' }, { id: 'categories', label: 'Categories' }]}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                        className="flex-1 md:flex-none"
                    />
                    {activeTab === 'expense' && (
                        <Button onClick={handleAddNew} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 px-4 h-[42px] rounded-xl flex items-center gap-2">
                            <Plus size={18} strokeWidth={3} />
                            <span className="hidden md:inline font-bold uppercase text-xs tracking-wider">Add Expense</span>
                        </Button>
                    )}
                </div>
            </div>

            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card className="p-8 sticky top-8">
                            <h2 className="text-base font-bold text-stone-900 mb-6 uppercase tracking-widest">Manage Categories</h2>
                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 mb-1.5 ml-1 uppercase tracking-widest">Category Name</label>
                                    <div className="flex gap-2">
                                        <Input
                                            required
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            placeholder="e.g. Food, Transport"
                                            className="bg-white"
                                        />
                                        <Button type="submit" disabled={loading} className="px-4 bg-orange-600 hover:bg-orange-700 text-white shadow-sm">
                                            {editingCategory ? <Save size={18} /> : <Plus size={18} />}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                            <div className="mt-8 space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Your Categories</h3>
                                {categories.map(cat => (
                                    <div key={cat.id} className="group flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-100 hover:border-orange-500/30 hover:bg-white transition-all duration-300">
                                        <span className="font-bold text-stone-700">{cat.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }} className="p-2 text-stone-400 hover:text-teal-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit3 size={14} /></button>
                                            <button onClick={() => handleCategoryDelete(cat)} className="p-2 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'expense' && (
                <div className="space-y-4">
                    {/* Desktop Table */}
                    <Card className="hidden md:block p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-stone-900 uppercase tracking-widest">Expenditure History</h2>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-stone-200">
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
                                <tbody className="divide-y divide-stone-100">
                                    {([...expenses]).sort((a, b) => new Date(b.date) - new Date(a.date)).map((expense) => (
                                        <tr key={expense.id} className="hover:bg-stone-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-stone-900">{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                                            <td className="px-6 py-4">
                                                <span className="badge-standard bg-orange-50 text-orange-600 border-orange-100">
                                                    {categories.find(c => c.id === expense.categoryId)?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-stone-500 font-medium italic">
                                                {cards.find(c => c.id === expense.cardId)?.name || 'Unknown Card'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-orange-600 text-lg">
                                                -${expense.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <button onClick={() => handleExpenseRepeat(expense)} className="p-2 text-stone-400 hover:text-teal-600 bg-white border border-stone-200 rounded-lg shadow-sm transition-all hover:scale-110" title="Repeat Expense"><RotateCcw size={14} /></button>
                                                    <button onClick={() => handleExpenseEdit(expense)} className="p-2 text-stone-400 hover:text-teal-600 bg-white border border-stone-200 rounded-lg shadow-sm transition-all hover:scale-110"><Edit3 size={14} /></button>
                                                    <button onClick={() => handleExpenseDelete(expense)} className="p-2 text-stone-400 hover:text-orange-600 bg-white border border-stone-200 rounded-lg shadow-sm transition-all hover:scale-110"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                                                No expenditure records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile List View */}
                    <div className="md:hidden space-y-4">
                        {([...expenses]).sort((a, b) => new Date(b.date) - new Date(a.date)).map((expense) => (
                            <Card key={expense.id} className="p-5 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-stone-800">
                                                {categories.find(c => c.id === expense.categoryId)?.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-orange-600">
                                        -${expense.amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                                    <span className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                                        <CreditCard size={12} />
                                        {cards.find(c => c.id === expense.cardId)?.name || 'Unknown'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleExpenseEdit(expense)} className="p-2 bg-stone-50 text-stone-600 rounded-lg border border-stone-200"><Edit3 size={14} /></button>
                                        <button onClick={() => handleExpenseDelete(expense)} className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {expenses.length === 0 && (
                            <div className="text-center py-12 text-stone-400 font-medium">No records found</div>
                        )}
                    </div>
                </div>
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
                title={editingExpense ? 'Edit Expense Record' : 'Add New Expense'}
                size="md"
            >
                <form onSubmit={handleExpenseSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Spending Category</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <select
                                required
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-stone-900 focus:border-teal-600/50 focus:ring-4 focus:ring-teal-600/10 outline-none transition-all appearance-none text-sm font-medium"
                            >
                                <option value="">Select Category...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Payment Method (Card/Account)</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                            <select
                                required
                                value={cardId}
                                onChange={(e) => setCardId(e.target.value)}
                                disabled={editingExpense}
                                className="w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 py-3 text-stone-900 focus:border-teal-600/50 focus:ring-4 focus:ring-teal-600/10 outline-none transition-all disabled:bg-stone-50 disabled:opacity-50 appearance-none text-sm font-medium"
                            >
                                <option value="">Select Account...</option>
                                {cards.map(c => <option key={c.id} value={c.id}>{c.name} (${c.balance.toLocaleString()})</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Expense Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
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
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Amount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600" size={18} />
                                <Input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={editingExpense}
                                    className="pl-11 font-black text-lg"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-stone-100">
                        <Button
                            type="button"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingExpense(null);
                                setCategoryId('');
                                setCardId('');
                                setAmount('');
                            }}
                            className="flex-1 bg-stone-100 text-stone-600 hover:bg-stone-200 border-none h-12 text-xs font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-[2] bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-200 transition-all h-12 text-xs font-bold uppercase tracking-widest">
                            {loading ? 'Processing...' : (editingExpense ? 'Update Record' : 'Confirm Expense')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
