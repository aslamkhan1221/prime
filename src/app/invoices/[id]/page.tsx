'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { InvoicePrintView } from '@/components/InvoicePrintView';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { EditPaymentModal } from '@/components/EditPaymentModal';
import { PaymentReceiptModal } from '@/components/PaymentReceiptModal';
import { ZohoPaymentForm } from '@/components/ZohoPaymentForm';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CreditCard,
  Edit2,
  Copy,
  Trash2,
  ArrowLeft,
  X,
  Printer,
  Pencil,
} from 'lucide-react';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Edit Payment Receipt Modal state
  const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<any>(null);

  // View Payment Receipt Modal state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptToView, setReceiptToView] = useState<any>(null);

  // Delete Payment Modal state
  const [deletePaymentConfirmOpen, setDeletePaymentConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // Delete Invoice modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchInvoice = async (isSilent = false) => {
    if (!isSilent && !invoice) setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load invoice');
      setInvoice(data.invoice);
      setSettings(data.settings);
      setPaymentAmount(data.invoice?.balanceAmount || 0);
    } catch (err: any) {
      if (!isSilent) error(err.message || 'Error loading invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [params.id]);

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to duplicate');
      success(`Duplicated as Invoice #${data.invoice.invoiceNumber}`);
      router.push(`/invoices/${data.invoice.id}`);
    } catch (err: any) {
      error(err.message || 'Failed to duplicate invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
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
          invoiceId: invoice.id,
          amount: paymentAmount,
          paymentDate,
          paymentMethod,
          referenceNumber,
          notes: paymentNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      // INSTANT DISPLAY: Update payment & balance immediately
      const newPaid = (invoice.paidAmount || 0) + Number(paymentAmount);
      const newBal = Math.max(0, (invoice.grandTotal || 0) - newPaid);
      const newStatus = newBal === 0 ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : invoice.status;
      setInvoice((prev: any) => ({
        ...prev,
        paidAmount: newPaid,
        balanceAmount: newBal,
        status: newStatus,
        payments: [
          {
            id: data.payment?.id || 'temp',
            amount: Number(paymentAmount),
            paymentDate: new Date(paymentDate),
            paymentMethod,
            referenceNumber,
            notes: paymentNotes,
          },
          ...(prev?.payments || []),
        ],
      }));
      setPaymentAmount(newBal);
      setPaymentModalOpen(false);
      success('Payment recorded successfully');
      fetchInvoice(true); // Silent background sync
    } catch (err: any) {
      error(err.message || 'Error recording payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeleteInvoice = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete invoice');
      success('Invoice deleted successfully');
      router.push('/invoices');
    } catch (err: any) {
      error(err.message || 'Error deleting invoice');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setDeletingPayment(true);
    try {
      const res = await fetch(`/api/payments/${paymentToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete payment receipt');
      success('Payment receipt deleted and balance recalculated');
      setDeletePaymentConfirmOpen(false);
      setPaymentToDelete(null);
      fetchInvoice(true);
    } catch (err: any) {
      error(err.message || 'Error deleting payment receipt');
    } finally {
      setDeletingPayment(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-500">Loading invoice details...</div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-rose-400 font-bold mb-4">Invoice not found</p>
          <Link href="/invoices" className="px-4 py-2 bg-slate-800 rounded-xl text-xs text-white">
            Return to Invoices
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Action Header (Hidden during Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-6 rounded-full bg-gradient-to-b from-[#00a3e0] via-[#ec008c] to-[#ffd100]" />
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Invoice #{invoice.invoiceNumber}
                </h1>
              </div>
              <p className="text-xs text-slate-500">Client: {invoice.customer?.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {invoice.balanceAmount > 0 && invoice.status !== 'CANCELLED' && (
              <Link
                href={`/payments/new?invoiceId=${invoice.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
              >
                <CreditCard className="w-4 h-4" />
                <span>Record Payment</span>
              </Link>
            )}

            <button
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>

            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl text-xs transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Component */}
        <InvoicePrintView invoice={invoice} settings={settings} onBack={() => router.push('/invoices')} />

        {/* Payment History List for this invoice */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="no-print bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Recorded Payment Receipts</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {invoice.payments.length} receipt{invoice.payments.length === 1 ? '' : 's'} recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="pb-2">Receipt #</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Method</th>
                    <th className="pb-2">Reference</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="py-2.5 text-slate-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-2.5 text-slate-700 font-medium">{p.paymentMethod}</td>
                      <td className="py-2.5 text-slate-500 font-mono text-[11px]">{p.referenceNumber || '-'}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setReceiptToView({ ...p, invoice });
                              setReceiptModalOpen(true);
                            }}
                            title="View & Print Official Receipt"
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setPaymentToEdit({ ...p, invoice });
                              setEditPaymentModalOpen(true);
                            }}
                            title="Edit Payment Receipt"
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setPaymentToDelete(p);
                              setDeletePaymentConfirmOpen(true);
                            }}
                            title="Delete Payment Receipt"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-800 text-sm">Record Payment for #{invoice.invoiceNumber}</h2>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                <ZohoPaymentForm
                  initialInvoiceId={invoice.id}
                  isModal={true}
                  onClose={() => setPaymentModalOpen(false)}
                  onSuccess={() => {
                    setPaymentModalOpen(false);
                    fetchInvoice(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal for Invoice */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteInvoice}
          isLoading={deleting}
          title="Delete Tax Invoice"
          message={`Are you sure you want to delete invoice #${invoice.invoiceNumber}? This action cannot be undone.`}
          confirmText="Delete Invoice"
        />

        {/* Delete Confirmation Modal for Payment Receipt */}
        <ConfirmModal
          isOpen={deletePaymentConfirmOpen}
          onClose={() => {
            setDeletePaymentConfirmOpen(false);
            setPaymentToDelete(null);
          }}
          onConfirm={handleDeletePayment}
          isLoading={deletingPayment}
          title="Delete Payment Receipt"
          message={`Are you sure you want to delete payment receipt #${paymentToDelete?.paymentNumber}? The invoice balance will be automatically recalculated.`}
          confirmText="Delete Payment"
        />

        {/* Edit Payment Receipt Modal */}
        <EditPaymentModal
          isOpen={editPaymentModalOpen}
          onClose={() => {
            setEditPaymentModalOpen(false);
            setPaymentToEdit(null);
          }}
          payment={paymentToEdit}
          onSuccess={() => {
            fetchInvoice(true);
          }}
        />

        {/* View / Print Payment Receipt Voucher */}
        <PaymentReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => {
            setReceiptModalOpen(false);
            setReceiptToView(null);
          }}
          payment={receiptToView}
          onEditClick={(p) => {
            setPaymentToEdit(p);
            setEditPaymentModalOpen(true);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
