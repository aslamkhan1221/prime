'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '@/lib/utils';
import {
  CreditCard,
  Search,
  Plus,
  Trash2,
  FileText,
  Building,
  CheckCircle,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = `/api/payments?search=${encodeURIComponent(search)}&paymentMethod=${methodFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch {
      error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpaidInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      const pending = (data.invoices || []).filter((i: any) => i.balanceAmount > 0 && i.status !== 'CANCELLED');
      setUnpaidInvoices(pending);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchUnpaidInvoices();
  }, [methodFilter]);

  const openAddModal = () => {
    fetchUnpaidInvoices();
    if (unpaidInvoices.length > 0) {
      setSelectedInvoiceId(unpaidInvoices[0].id);
      setAmount(unpaidInvoices[0].balanceAmount);
    } else {
      setSelectedInvoiceId('');
      setAmount(0);
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setReferenceNumber('');
    setNotes('');
    setModalOpen(true);
  };

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = unpaidInvoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(inv.balanceAmount);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      error('Please select an invoice');
      return;
    }
    if (amount <= 0) {
      error('Payment amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount,
          paymentDate,
          paymentMethod,
          referenceNumber,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      success('Payment recorded successfully');
      setModalOpen(false);
      fetchPayments();
      fetchUnpaidInvoices();
    } catch (err: any) {
      error(err.message || 'Error recording payment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/payments/${paymentToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete payment');

      success('Payment deleted and invoice balance recalculated');
      setDeleteConfirmOpen(false);
      fetchPayments();
      fetchUnpaidInvoices();
    } catch (err: any) {
      error(err.message || 'Error deleting payment');
    } finally {
      setDeleting(false);
    }
  };

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Payment Receipts & Ledger"
          subtitle="Track cash inflows, UPI transfers, bank deposits, and outstanding invoice balances"
          actionText="Record Payment"
          onActionClick={openAddModal}
          actionIcon={<Plus className="w-4 h-4" />}
        />

        {/* Total Collected Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 p-5 rounded-3xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Collections (All Recorded Payments)
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                {formatCurrency(totalCollected)}
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            {payments.length} Transaction(s) Logged
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search receipt #, invoice #, ref #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Payment Methods</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Invoice Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4">Method & Ref</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading payment transactions...
                    </td>
                  </tr>
                ) : payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        {p.paymentNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#00a3e0]">
                        <Link href={`/invoices/${p.invoice?.id}`} className="hover:underline">
                          {p.invoice?.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.invoice?.customer?.name}</div>
                        {p.invoice?.customer?.companyName && (
                          <div className="text-[10px] text-slate-400">{p.invoice.customer.companyName}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{p.paymentMethod}</span>
                        {p.referenceNumber && (
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">{p.referenceNumber}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setPaymentToDelete(p);
                              setDeleteConfirmOpen(true);
                            }}
                            title="Delete Payment Transaction"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No payment receipts recorded yet. Click &quot;Record Payment&quot; to log client settlements.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Payment Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Record Client Payment</h3>
                    <p className="text-xs text-slate-500">Log bank transfer, UPI or cash receipt</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Invoice <span className="text-[#ec008c]">*</span>
                  </label>
                  {unpaidInvoices.length > 0 ? (
                    <select
                      required
                      value={selectedInvoiceId}
                      onChange={(e) => handleInvoiceChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-medium"
                    >
                      {unpaidInvoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          #{inv.invoiceNumber} - {inv.customer?.name} (Due: ₹{inv.balanceAmount})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                      All invoices are fully paid or no unpaid invoices found.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount Received (₹) <span className="text-[#ec008c]">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="CASH">Cash</option>
                      <option value="CARD">Credit / Debit Card</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. UTR / UPI reference ID"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Payment notes or cheque details..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !selectedInvoiceId}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    {saving ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeletePayment}
          isLoading={deleting}
          title="Delete Payment Receipt"
          message={`Are you sure you want to delete payment receipt #${paymentToDelete?.paymentNumber}? The invoice balance will be automatically restored.`}
          confirmText="Delete Payment"
        />
      </div>
    </DashboardLayout>
  );
}
