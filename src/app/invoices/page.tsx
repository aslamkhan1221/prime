'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ZohoPaymentForm } from '@/components/ZohoPaymentForm';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FileText,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CreditCard,
  Printer,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  LayoutTemplate,
  Shield,
  Layers,
  X,
} from 'lucide-react';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [duplicateFilter, setDuplicateFilter] = useState<'all' | 'original' | 'duplicate'>('all');
  const [isPortalMode, setIsPortalMode] = useState(false);

  // Quick Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const { success, error } = useToast();

  // Check portal mode
  useEffect(() => {
    fetch('/api/portal/mode')
      .then((r) => r.json())
      .then((d) => {
        if (d.isPortalMode || d.role === 'PARTNER') {
          setIsPortalMode(true);
          setDuplicateFilter('duplicate');
        }
      })
      .catch(() => {});
  }, []);

  const fetchInvoices = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let dupParam = '';
      if (isPortalMode || duplicateFilter === 'duplicate') {
        dupParam = '&isDuplicate=true';
      } else if (duplicateFilter === 'original') {
        dupParam = '&isDuplicate=false';
      }

      const url = `/api/invoices?search=${encodeURIComponent(search)}&status=${statusFilter}${dupParam}`;
      const res = await fetch(url);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch {
      if (!isSilent) error('Failed to load invoices');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, duplicateFilter, isPortalMode]);

  const handleToggleDuplicate = async (invoiceId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // INSTANT DISPLAY:
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, isDuplicate: newStatus } : inv))
    );
    success(
      newStatus
        ? 'Invoice marked as Duplicate (Visible in Portal)'
        : 'Invoice marked as Original (Hidden from Portal)'
    );

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDuplicate: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update duplicate status');
    } catch (err: any) {
      error(err.message || 'Error updating duplicate status');
      fetchInvoices(true);
    }
  };

  const handleDuplicate = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to duplicate');
      
      // INSTANT DISPLAY: Add duplicated invoice to top
      if (data.invoice) {
        setInvoices((prev) => [data.invoice, ...prev]);
      }
      success(`Duplicated as Portal Invoice #${data.invoice?.invoiceNumber}`);
      fetchInvoices(true); // Silent sync
    } catch (err: any) {
      error(err.message || 'Error duplicating invoice');
    }
  };

  const openPaymentModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balanceAmount > 0 ? invoice.balanceAmount : invoice.grandTotal);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setReferenceNumber('');
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (paymentAmount <= 0) {
      error('Payment amount must be greater than 0');
      return;
    }

    setSavingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: paymentAmount,
          paymentDate,
          paymentMethod,
          referenceNumber,
          notes: paymentNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      // INSTANT DISPLAY: Immediately update invoice payment & balance in list
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.id === selectedInvoice.id) {
            const newPaid = (inv.paidAmount || 0) + Number(paymentAmount);
            const newBal = Math.max(0, (inv.grandTotal || 0) - newPaid);
            const newStatus = newBal === 0 ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : inv.status;
            return {
              ...inv,
              paidAmount: newPaid,
              balanceAmount: newBal,
              status: newStatus,
            };
          }
          return inv;
        })
      );

      setPaymentModalOpen(false);
      success('Payment recorded and invoice status updated!');
      fetchInvoices(true); // Silent background sync
    } catch (err: any) {
      error(err.message || 'Error recording payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    const targetId = invoiceToDelete.id;
    // INSTANT DISPLAY: Remove immediately from list
    setInvoices((prev) => prev.filter((inv) => inv.id !== targetId));
    setDeleteConfirmOpen(false);
    success('Invoice deleted successfully');

    try {
      const res = await fetch(`/api/invoices/${targetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete invoice');
      fetchInvoices(true); // Silent background sync
    } catch (err: any) {
      error(err.message || 'Error deleting invoice');
      fetchInvoices(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title={isPortalMode ? "Portal Invoices & Billing" : "Invoices & Billing"}
          subtitle={
            isPortalMode
              ? "Displaying duplicate invoice records for partner portal management"
              : "Generate GST invoices, track payments, download PDF and manage receivables"
          }
          actionText="Create Invoice"
          actionHref="/invoices/new"
          actionIcon={<Plus className="w-4 h-4" />}
          secondaryActionText="Edit Template"
          secondaryActionHref="/templates"
          secondaryActionIcon={<LayoutTemplate className="w-4 h-4 text-brand-600" />}
        />

        {/* Portal Mode Notice */}
        {isPortalMode && (
          <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              <span>Portal View Active: Only duplicate invoice records are displayed here and on the dashboard.</span>
            </div>
            <span className="text-[11px] bg-purple-200/60 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">
              Duplicate Invoices Only
            </span>
          </div>
        )}

        {/* Filter & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice #, customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 flex-wrap">
            {/* Admin Filter between All / Original / Duplicate Invoices */}
            {!isPortalMode && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
                <button
                  onClick={() => setDuplicateFilter('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    duplicateFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDuplicateFilter('original')}
                  className={`px-3 py-1 rounded-lg transition ${
                    duplicateFilter === 'original'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Original Only
                </button>
                <button
                  onClick={() => setDuplicateFilter('duplicate')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    duplicateFilter === 'duplicate'
                      ? 'bg-purple-600 text-white shadow-sm font-bold'
                      : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicate (Portal)</span>
                </button>
              </div>
            )}

            {/* Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {['ALL', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition shrink-0 ${
                    statusFilter === st
                      ? 'bg-gradient-to-r from-[#00a3e0] to-[#0284c7] text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Invoice Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-3 text-center">Type</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <div>Loading invoices...</div>
                    </td>
                  </tr>
                ) : invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00a3e0] text-sm">
                        <Link href={`/invoices/${inv.id}`} className="hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/customers/${inv.customer?.id}`} className="font-bold text-slate-900 hover:text-[#00a3e0]">
                          {inv.customer?.name}
                        </Link>
                        {inv.customer?.companyName && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{inv.customer.companyName}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-semibold">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={inv.balanceAmount > 0 ? 'text-[#f59e0b]' : 'text-slate-400'}>
                          {formatCurrency(inv.balanceAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {inv.isDuplicate ? (
                          <button
                            onClick={() => !isPortalMode && handleToggleDuplicate(inv.id, true)}
                            title={!isPortalMode ? "Click to set as Original Invoice" : "Duplicate Portal Copy"}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1 ${
                              !isPortalMode ? 'hover:bg-purple-100 cursor-pointer shadow-sm' : 'cursor-default'
                            }`}
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>Duplicate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => !isPortalMode && handleToggleDuplicate(inv.id, false)}
                            title="Click to mark as Duplicate (Portal Visible)"
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 ${
                              !isPortalMode ? 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 cursor-pointer' : 'cursor-default'
                            }`}
                          >
                            <span>Original</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : inv.status === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : inv.status === 'CANCELLED'
                              ? 'bg-slate-100 text-slate-400 line-through'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.balanceAmount > 0 && inv.status !== 'CANCELLED' && (
                            <Link
                              href={`/payments/new?invoiceId=${inv.id}`}
                              title="Record Payment"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-emerald-200 shadow-sm"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Pay</span>
                            </Link>
                          )}
                          <Link
                            href={`/invoices/${inv.id}`}
                            title="View / Print Invoice"
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(inv.id)}
                            title="Duplicate Invoice"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/invoices/${inv.id}/edit`}
                            title="Edit Invoice"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setInvoiceToDelete(inv);
                              setDeleteConfirmOpen(true);
                            }}
                            title="Delete Invoice"
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
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No invoices found. Click "Create Invoice" to start billing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Record Payment Quick Modal */}
        {paymentModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-800 text-sm">Record Payment for #{selectedInvoice.invoiceNumber}</h2>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <ZohoPaymentForm
                  initialInvoiceId={selectedInvoice.id}
                  isModal={true}
                  onClose={() => setPaymentModalOpen(false)}
                  onSuccess={() => {
                    setPaymentModalOpen(false);
                    fetchInvoices(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteInvoice}
          isLoading={deleting}
          title="Delete Tax Invoice"
          message={`Are you sure you want to delete invoice "${invoiceToDelete?.invoiceNumber}"? Note: Invoices with recorded payment receipts cannot be deleted directly.`}
          confirmText="Delete Invoice"
        />
      </div>
    </DashboardLayout>
  );
}
