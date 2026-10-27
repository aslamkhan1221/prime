'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, Hash, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { formatCurrency, PAYMENT_METHODS } from '@/lib/utils';
import { useToast } from '@/components/Toast';

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any | null;
  onSuccess: (updatedPayment: any) => void;
}

export function EditPaymentModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}: EditPaymentModalProps) {
  const { error, success } = useToast();

  const [paymentNumber, setPaymentNumber] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (payment) {
      setPaymentNumber(payment.paymentNumber || '');
      setAmount(payment.amount || 0);
      const d = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
      setPaymentDate(isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0]);
      setPaymentMethod(payment.paymentMethod || 'UPI');
      setReferenceNumber(payment.referenceNumber || '');
      setNotes(payment.notes || '');
    }
  }, [payment]);

  if (!isOpen || !payment) return null;

  // Invoice context
  const invoice = payment.invoice || {};
  const grandTotal = Number(invoice.grandTotal) || 0;
  const originalAmount = Number(payment.amount) || 0;
  const currentPaid = Number(invoice.paidAmount) || 0;
  
  // Real-time recalculated values
  const otherPaymentsTotal = Math.max(0, currentPaid - originalAmount);
  const projectedPaid = otherPaymentsTotal + (Number(amount) || 0);
  const projectedBalance = Math.max(0, grandTotal - projectedPaid);
  const isOverpaid = grandTotal > 0 && projectedPaid > grandTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      error('Payment receipt amount must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentNumber: paymentNumber.trim(),
          amount: numAmount,
          paymentDate,
          paymentMethod,
          referenceNumber: referenceNumber.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update payment receipt');
      }

      success(`Payment receipt #${data.payment?.paymentNumber || paymentNumber} updated successfully`);
      onSuccess(data.payment);
      onClose();
    } catch (err: any) {
      error(err.message || 'Error updating payment receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Edit Payment Receipt</h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-brand-100 text-brand-700 rounded-md">
                  {payment.paymentNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">Modify receipt amount, method, date, or references anytime</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Context Banner */}
        {invoice.invoiceNumber && (
          <div className="px-6 py-3.5 bg-gradient-to-r from-slate-50 via-brand-50/30 to-slate-50 border-b border-slate-100 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 font-medium">Applied to Invoice: </span>
              <span className="font-mono font-bold text-slate-900">#{invoice.invoiceNumber}</span>
              {invoice.customer?.name && (
                <span className="text-slate-600 ml-1.5">({invoice.customer.name})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Invoice Total:</span>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt Number</label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-semibold focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Receipt Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Real-time Balance Recalculation Impact */}
          {grandTotal > 0 && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Original Receipt:</span>
                <span className="font-mono font-semibold text-slate-700">{formatCurrency(originalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 flex items-center gap-1">
                  <span>Projected Invoice Balance:</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </span>
                <span className={`font-mono font-bold ${projectedBalance === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {formatCurrency(projectedBalance)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                <span className="text-slate-500">Invoice Status Result:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    projectedBalance === 0
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : projectedPaid > 0
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {projectedBalance === 0 ? 'PAID IN FULL' : projectedPaid > 0 ? 'PARTIALLY PAID' : 'UNPAID'}
                </span>
              </div>
              {isOverpaid && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Amount exceeds invoice total ({formatCurrency(grandTotal)}). Excess payment recorded.</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
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
              placeholder="e.g. UTR / UPI Ref / Cheque No."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Narration</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes or transaction remarks..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/25 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
