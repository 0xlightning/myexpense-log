import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { addItem, updateItem, deleteItem, subscribeToCollection, collections } from '../services/firestore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { format } from 'date-fns';
import {
    PiggyBank, Plus, Edit3, Trash2, AlertTriangle,
    CheckCircle, TrendingDown, DollarSign, Target
} from 'lucide-react';

export default function Budgeting() {
    const { currentUser } = useAuth();

    // Data
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]); // Expense categories
    const [expenses, setExpenses] = useState([]);     // Expenditure records
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [editingBudget, setEditingBudget] = useState(null);
    const [categoryId, setCategoryId] = useState('');
    const [limitAmount, setLimitAmount] = useState('');
    const [period, setPeriod] = useState('monthly'); // monthly | annual

    // Current month filter
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    );

    useEffect(() => {
        if (!currentUser) return;
        const unsubBudgets = subscribeToCollection(currentUser.uid, collections.budgets, setBudgets);
        const unsubCats = subscribeToCollection(currentUser.uid, collections.expense_categories, setCategories);
        const unsubExp = subscribeToCollection(currentUser.uid, collections.expenditure_records, setExpenses);
        return () => { unsubBudgets(); unsubCats(); unsubExp(); };
    }, [currentUser]);

    // Calculate actual spending per category in selected month
    const monthlySpendByCategory = expenses
        .filter(e => e.date && e.date.startsWith(selectedMonth))
        .reduce((acc, expense) => {
            const key = expense.categoryId || 'uncategorized';
            acc[key] = (acc[key] || 0) + parseFloat(expense.amount || 0);
            return acc;
        }, {});

    // Budget cards with spending progress
    const budgetsWithProgress = budgets.map(budget => {
        const spent = monthlySpendByCategory[budget.categoryId] || 0;
        const limit = parseFloat(budget.limitAmount) || 0;
        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const catName = budget.categoryId === 'other'
            ? 'Other'
            : (categories.find(c => c.id === budget.categoryId)?.name || 'Uncategorized');
        return { ...budget, spent, limit, pct, catName };
    });

    const totalBudgeted = budgetsWithProgress.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgetsWithProgress.reduce((s, b) => s + b.spent, 0);
    const overBudgetCount = budgetsWithProgress.filter(b => b.spent > b.limit && b.limit > 0).length;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryId || !limitAmount) return;
        setLoading(true);
        try {
            const data = {
                categoryId,
                limitAmount: parseFloat(limitAmount),
                period
            };
            if (editingBudget) {
                await updateItem(currentUser.uid, collections.budgets, editingBudget.id, data);
                setEditingBudget(null);
            } else {
                await addItem(currentUser.uid, collections.budgets, data);
            }
            setCategoryId('');
            setLimitAmount('');
            setPeriod('monthly');
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('Failed to save budget: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (budget) => {
        setEditingBudget(budget);
        setCategoryId(budget.categoryId);
        setLimitAmount(budget.limitAmount);
        setPeriod(budget.period || 'monthly');
        setIsModalOpen(true);
    };

    const handleDelete = async (budget) => {
        if (window.confirm('Delete this budget?')) {
            try {
                await deleteItem(currentUser.uid, collections.budgets, budget.id);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleAddNew = () => {
        setEditingBudget(null);
        setCategoryId('');
        setLimitAmount('');
        setPeriod('monthly');
        setIsModalOpen(true);
    };

    const getStatusColor = (pct, limit) => {
        if (limit === 0) return { bar: 'bg-stone-300', text: 'text-stone-400', badge: 'bg-stone-50 text-stone-400 border-stone-100' };
        if (pct >= 100) return { bar: 'bg-rose-500', text: 'text-rose-600', badge: 'bg-rose-50 text-rose-600 border-rose-100' };
        if (pct >= 80) return { bar: 'bg-amber-500', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-600 border-amber-100' };
        return { bar: 'bg-teal-500', text: 'text-teal-600', badge: 'bg-teal-50 text-teal-600 border-teal-100' };
    };

    // Categories not yet budgeted
    const usedCategoryIds = budgets.map(b => b.categoryId);
    const availableCategories = categories.filter(c =>
        !usedCategoryIds.includes(c.id) || (editingBudget && editingBudget.categoryId === c.id)
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-3 uppercase">
                        <PiggyBank className="text-teal-600" size={28} />
                        Budgeting
                    </h1>
                    <p className="text-stone-500 mt-1 font-medium">Set category limits and track your spending health.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Month Selector */}
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Month:</label>
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-stone-800 outline-none cursor-pointer"
                        >
                            {Array.from({ length: 12 }, (_, i) => {
                                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                return (
                                    <option key={val} value={val}>
                                        {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <Button
                        onClick={handleAddNew}
                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50 px-6 h-[42px] rounded-xl flex items-center gap-2 justify-center"
                    >
                        <Plus size={18} strokeWidth={3} />
                        <span className="font-bold uppercase text-xs tracking-wider">Add Budget</span>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100">
                            <Target size={18} className="text-teal-600" />
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Budgeted</p>
                    </div>
                    <h3 className="text-2xl font-black text-stone-900 tracking-tight">${totalBudgeted.toLocaleString()}</h3>
                    <p className="text-[10px] text-stone-400 mt-1 font-medium">{format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100">
                            <TrendingDown size={18} className="text-orange-600" />
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Total Spent</p>
                    </div>
                    <h3 className={`text-2xl font-black tracking-tight ${totalSpent > totalBudgeted && totalBudgeted > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
                        ${totalSpent.toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-1 font-medium">Across all budgeted categories</p>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2.5 rounded-xl border ${overBudgetCount > 0 ? 'bg-rose-50 border-rose-100' : 'bg-stone-100 border-stone-200'}`}>
                            <AlertTriangle size={18} className={overBudgetCount > 0 ? 'text-rose-600' : 'text-stone-400'} />
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Over Budget</p>
                    </div>
                    <h3 className={`text-2xl font-black tracking-tight ${overBudgetCount > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
                        {overBudgetCount} {overBudgetCount === 1 ? 'Category' : 'Categories'}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-1 font-medium">Exceeded this month</p>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-lime-50 rounded-xl border border-lime-100">
                            <CheckCircle size={18} className="text-lime-600" />
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Remaining</p>
                    </div>
                    <h3 className={`text-2xl font-black tracking-tight ${(totalBudgeted - totalSpent) < 0 ? 'text-rose-600' : 'text-lime-600'}`}>
                        ${(totalBudgeted - totalSpent).toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-1 font-medium">Budget remaining this month</p>
                </Card>
            </div>

            {/* Budget Progress Cards */}
            {budgetsWithProgress.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {budgetsWithProgress.map(budget => {
                        const colors = getStatusColor(budget.pct, budget.limit);
                        return (
                            <Card key={budget.id} className="p-6 group relative">
                                {/* Actions */}
                                <div className="absolute top-4 right-4 flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(budget)}
                                        className="p-1.5 text-stone-400 hover:text-teal-600 bg-stone-50 hover:bg-teal-50 rounded-lg border border-stone-200 transition-all"
                                    >
                                        <Edit3 size={12} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(budget)}
                                        className="p-1.5 text-stone-400 hover:text-rose-600 bg-stone-50 hover:bg-rose-50 rounded-lg border border-stone-200 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>

                                {/* Category Name + Period Badge */}
                                <div className="flex items-start gap-3 mb-5 pr-16">
                                    <div className={`p-2.5 rounded-xl border ${colors.badge}`}>
                                        <DollarSign size={16} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-stone-800 uppercase tracking-tight text-sm">{budget.catName}</h3>
                                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{budget.period || 'Monthly'} budget</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                        <span>Spent</span>
                                        <span className={colors.text}>{budget.pct.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                                            style={{ width: `${budget.pct}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-stone-700">${budget.spent.toLocaleString()} spent</span>
                                        <span className="text-stone-400">of ${budget.limit.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Remaining amount */}
                                <div className={`text-right text-xs font-black ${budget.spent > budget.limit && budget.limit > 0 ? 'text-rose-600' : 'text-teal-600'}`}>
                                    {budget.limit > 0
                                        ? budget.spent > budget.limit
                                            ? `⛔ $${(budget.spent - budget.limit).toLocaleString()} over limit`
                                            : `✓ $${(budget.limit - budget.spent).toLocaleString()} remaining`
                                        : 'No limit set'
                                    }
                                </div>

                                {/* Alert Messages */}
                                {budget.pct >= 100 && (
                                    <div className="mt-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                                            ⛔ Budget exceeded! Review your spending.
                                        </p>
                                    </div>
                                )}
                                {budget.pct >= 80 && budget.pct < 100 && (
                                    <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                                            ⚠ Approaching limit — only ${(budget.limit - budget.spent).toLocaleString()} left.
                                        </p>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="p-16 text-center border-2 border-dashed border-stone-200">
                    <PiggyBank size={48} className="mx-auto text-stone-300 mb-4" />
                    <h3 className="font-black text-stone-400 uppercase tracking-[0.2em] text-sm mb-2">No Budgets Set</h3>
                    <p className="text-stone-400 text-sm font-medium mb-6">
                        Create your first budget to start tracking spending against limits.
                    </p>
                    <Button onClick={handleAddNew} className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 mx-auto">
                        <Plus size={14} className="mr-2" /> Create First Budget
                    </Button>
                </Card>
            )}

            {/* Budget Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingBudget(null);
                    setCategoryId('');
                    setLimitAmount('');
                    setPeriod('monthly');
                }}
                title={editingBudget ? 'Edit Budget' : 'Create New Budget'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Expense Category</label>
                        <select
                            required
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            disabled={!!editingBudget}
                            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 focus:border-teal-600/50 focus:ring-4 focus:ring-teal-600/10 outline-none transition-all appearance-none text-sm font-medium disabled:opacity-60"
                        >
                            <option value="">Select Category...</option>
                            {availableCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                            {(!usedCategoryIds.includes('other') || (editingBudget && editingBudget.categoryId === 'other')) && (
                                <option value="other">Other</option>
                            )}
                        </select>
                        {editingBudget && (
                            <p className="text-[10px] text-stone-400 font-medium ml-1">Category cannot be changed after creation.</p>
                        )}
                    </div>

                    {/* Period */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Budget Period</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['monthly', 'annual'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriod(p)}
                                    className={`py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all ${period === p
                                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                                        : 'bg-white text-stone-500 border-stone-200 hover:border-teal-600/40'
                                        }`}
                                >
                                    {p === 'monthly' ? 'Monthly' : 'Annual'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Limit Amount */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">
                            Spending Limit ({period === 'monthly' ? 'per month' : 'per year'})
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
                            <Input
                                type="number"
                                required
                                step="0.01"
                                min="1"
                                value={limitAmount}
                                onChange={e => setLimitAmount(e.target.value)}
                                placeholder="e.g. 500"
                                className="pl-11 bg-white font-black text-xl"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-8 pt-6 border-t border-stone-100">
                        <Button
                            type="button"
                            onClick={() => { setIsModalOpen(false); setEditingBudget(null); }}
                            className="flex-1 bg-stone-100 text-stone-600 hover:bg-stone-200 border-none h-12 text-xs font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200/50 h-12 text-xs font-bold uppercase tracking-widest"
                        >
                            {loading ? 'Saving...' : (editingBudget ? 'Update Budget' : 'Create Budget')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
