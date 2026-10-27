'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, Pencil, CreditCard, CheckCircle2, Building, Calendar, Hash, FileText } from 'lucide-react';
import { formatCurrency, formatDate, numberToWords } from '@/lib/utils';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any | null;
  onEditClick: (payment: any) => void;
}

export function PaymentReceiptModal({
  isOpen,
  onClose,
  payment,
  onEditClick,
}: PaymentReceiptModalProps) {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((d) => d.settings && setSettings(d.settings))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !payment) return null;

  const invoice = payment.invoice || {};
  const customer = invoice.customer || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Modal Top Bar (hidden on print) */}
        <div className="no-print flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
              <CreditCard className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-slate-900 text-sm">Payment Receipt Voucher</span>
              <span className="font-mono text-xs font-semibold text-brand-600 ml-2">
                #{payment.paymentNumber}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEditClick(payment);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs rounded-xl transition border border-brand-200"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Receipt</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-500/20 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Voucher Canvas */}
        <div className="p-8 overflow-y-auto print:p-6 print:m-0 print:overflow-visible">
          <div className="border-2 border-slate-900/90 rounded-2xl p-6 sm:p-8 bg-white text-slate-800 space-y-6 print:border print:border-black print:rounded-none">
            {/* Header: Company Details & Receipt Badge */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900/10">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {settings?.companyName || 'Prime Sublimation'}
                </h1>
                {settings?.address && (
                  <p className="text-xs text-slate-600 mt-1 max-w-sm whitespace-pre-line">{settings.address}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-1">
                  {settings?.phone && <span>Phone: {settings.phone}</span>}
                  {settings?.email && <span>Email: {settings.email}</span>}
                  {settings?.gstin && <span className="font-mono font-semibold">GSTIN: {settings.gstin}</span>}
                </div>
              </div>

              <div className="text-right sm:self-start bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl print:border-black print:bg-transparent">
                <span className="block text-[10px] font-black uppercase tracking-wider text-brand-600">
                  Payment Receipt
                </span>
                <span className="font-mono font-black text-lg text-slate-900">
                  {payment.paymentNumber}
                </span>
                <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                  Date: {formatDate(payment.paymentDate)}
                </span>
              </div>
            </div>

            {/* Receipt Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 print:bg-transparent print:border-slate-300">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Received With Thanks From:
                </span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{customer.name || 'Valued Client'}</div>
                {customer.companyName && (
                  <div className="text-slate-600 text-xs font-medium">{customer.companyName}</div>
                )}
                {customer.mobile && (
                  <div className="text-slate-500 text-[11px] mt-0.5">Phone: {customer.mobile}</div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Settlement Against Invoice:
                </span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  #{invoice.invoiceNumber || 'N/A'}
                </div>
                <div className="text-slate-600 text-[11px]">
                  Invoice Total: <span className="font-mono font-semibold">{formatCurrency(invoice.grandTotal || 0)}</span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  Remaining Balance: <span className="font-mono font-semibold">{formatCurrency(invoice.balanceAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Amount Box */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:bg-transparent print:border-slate-400">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Amount Received
                </span>
                <div className="text-xs text-slate-700 font-medium italic mt-0.5">
                  {numberToWords(payment.amount)}
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono sm:text-right print:text-black">
                {formatCurrency(payment.amount)}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-b border-slate-100 py-3 print:border-slate-300">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Payment Mode</span>
                <div className="font-semibold text-slate-900 mt-0.5">{payment.paymentMethod || 'Cash'}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Deposit To</span>
                <div className="font-semibold text-slate-900 mt-0.5">{payment.depositTo || 'Petty Cash'}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Ref / Cheque #</span>
                <div className="font-mono font-medium text-slate-900 mt-0.5">
                  {payment.referenceNumber || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Payment Status</span>
                <div className="flex items-center gap-1 font-bold mt-0.5">
                  {payment.status === 'DRAFT' ? (
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px]">Draft Receipt</span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Paid & Settled</span>
                    </span>
                  )}
                </div>
              </div>
              {payment.bankCharges > 0 && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Bank Charges</span>
                  <div className="font-mono text-slate-700 mt-0.5">{formatCurrency(payment.bankCharges)}</div>
                </div>
              )}
              {payment.tdsDeducted && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">TDS Deducted</span>
                  <div className="font-semibold text-blue-700 mt-0.5">Income TDS Applied</div>
                </div>
              )}
              {payment.paymentReceivedOn && (
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Received On</span>
                  <div className="text-slate-700 mt-0.5">{formatDate(payment.paymentReceivedOn)}</div>
                </div>
              )}
            </div>

            {/* Notes if any */}
            {payment.notes && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 print:bg-transparent print:border-slate-300">
                <span className="font-semibold text-slate-700">Remarks / Notes: </span>
                <span>{payment.notes}</span>
              </div>
            )}

            {/* Signatory Footer */}
            <div className="pt-8 flex justify-between items-end text-xs">
              <div className="text-[10px] text-slate-400 italic">
                * This is a computer generated official payment acknowledgement.
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-slate-900/40 pb-1 font-semibold text-slate-800 text-[11px]">
                  For {settings?.companyName || 'Prime Sublimation'}
                </div>
                <span className="block text-[10px] text-slate-500 uppercase font-bold mt-1">
                  Authorized Signatory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
