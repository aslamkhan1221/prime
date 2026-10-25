'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/utils';
import {
  Receipt,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  X,
  TrendingDown,
  DollarSign,
  Tag,
} from 'lucide-react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Printing Media & Vinyls',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    notes: '',
  });

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchExpenses = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const url = `/api/expenses?search=${encodeURIComponent(search)}&category=${categoryFilter}&paymentMethod=${methodFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotalAmount(data.totalAmount || 0);
    } catch {
      if (!isSilent) error('Failed to load expenses');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, methodFilter]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      category: 'Printing Media & Vinyls',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (exp: any) => {
    setEditingExpense(exp);
    setFormData({
      title: exp.title || '',
      category: exp.category || 'Printing Media & Vinyls',
      amount: exp.amount || 0,
      date: new Date(exp.date).toISOString().split('T')[0],
      description: exp.description || '',
      paymentMethod: exp.paymentMethod || 'BANK_TRANSFER',
      referenceNumber: exp.referenceNumber || '',
      notes: exp.notes || '',
    });
    setModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Expense title is required');
      return;
    }
    if (formData.amount <= 0) {
      error('Amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      if (editingExpense) {
        const res = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update expense');

        // INSTANT DISPLAY: Immediately update in table
        const updated = data.expense || { ...editingExpense, ...formData };
        setExpenses((prev) =>
          prev.map((exp) => (exp.id === editingExpense.id ? updated : exp))
        );
        setModalOpen(false);
        success('Expense updated successfully');
        fetchExpenses(true); // Silent background sync
      } else {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to record expense');

        // INSTANT DISPLAY: Immediately prepend new expense
        if (data.expense) {
          setExpenses((prev) => [data.expense, ...prev]);
          setTotalAmount((prev) => prev + Number(data.expense.amount || 0));
        }
        setModalOpen(false);
        success('Expense recorded successfully');
        fetchExpenses(true); // Silent background sync
      }
    } catch (err: any) {
      error(err.message || 'Error saving expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    const targetId = expenseToDelete.id;
    const targetAmount = expenseToDelete.amount || 0;
    // INSTANT DISPLAY: Remove immediately
    setExpenses((prev) => prev.filter((exp) => exp.id !== targetId));
    setTotalAmount((prev) => Math.max(0, prev - targetAmount));
    setDeleteConfirmOpen(false);
    success('Expense deleted successfully');

    try {
      const res = await fetch(`/api/expenses/${targetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete expense');
      fetchExpenses(true); // Silent background sync
    } catch (err: any) {
      error(err.message || 'Error deleting expense');
      fetchExpenses(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Expenses & Operational Overhead"
          subtitle="Track material purchases, media costs, software licenses, and studio expenses"
          actionText="Add New Expense"
          onActionClick={openAddModal}
          actionIcon={<Plus className="w-4 h-4" />}
        />

        {/* Expenses Summary Banner */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-[#ec008c] border border-rose-200">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Expenses Recorded
              </span>
              <div className="text-2xl font-black text-[#ec008c] font-mono mt-0.5">
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            {expenses.length} Expense Entry(s)
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expense title, description, ref #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchExpenses()}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="ALL">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="ALL">All Methods</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Expense Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <div>Loading expenses...</div>
                    </td>
                  </tr>
                ) : expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{exp.title}</div>
                        {exp.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{exp.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(exp.date)}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{exp.paymentMethod}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {exp.referenceNumber || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#ec008c] text-sm">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(exp)}
                            title="Edit Expense"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setExpenseToDelete(exp);
                              setDeleteConfirmOpen(true);
                            }}
                            title="Delete Expense"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No expense records found. Click "Add New Expense" to record costs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Expense Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-50 text-[#ec008c] border border-rose-200">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
                    </h3>
                    <p className="text-xs text-slate-500">Keep track of studio operational costs</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expense Title <span className="text-[#ec008c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Star Flex Vinyl Roll 100m, Adobe CC Subscription"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Expense Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-brand-500"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Amount (₹) <span className="text-[#ec008c]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-brand-500"
                    >
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Invoice / Receipt / UTR Ref #
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="e.g. Vendor Inv #1042 / UTR 918239"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Description & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Vendor details or items purchased..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#ec008c] to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteExpense}
          isLoading={deleting}
          title="Delete Expense Record"
          message={`Are you sure you want to delete expense "${expenseToDelete?.title}" of ${formatCurrency(expenseToDelete?.amount || 0)}?`}
          confirmText="Delete Expense"
        />
      </div>
    </DashboardLayout>
  );
}
