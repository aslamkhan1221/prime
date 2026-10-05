'use client';

import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Printer, Download, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface InvoicePrintViewProps {
  invoice: any;
  settings: any;
  onBack?: () => void;
}

export function InvoicePrintView({ invoice, settings, onBack }: InvoicePrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = settings?.currencySymbol || '₹';

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <span className="text-sm font-semibold text-white">
            Invoice #{invoice.invoiceNumber}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              invoice.status === 'PAID'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : invoice.status === 'PARTIALLY_PAID'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : invoice.status === 'OVERDUE'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {invoice.status.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Sheet (A4 format) */}
      <div className="invoice-printable bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-xl max-w-4xl mx-auto border border-slate-200">
        {/* Header: Company Details & Invoice Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div>
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-3" />
            ) : (
              <div className="text-2xl font-black tracking-tight text-brand-700 uppercase">
                {settings?.companyName || 'PixelCraft Design Studio'}
              </div>
            )}
            <p className="text-xs text-slate-600 max-w-sm mt-1 whitespace-pre-line leading-relaxed">
              {settings?.address || 'Design District, Creative Heights, Bangalore'}
            </p>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
              {settings?.phone && <div><span className="font-semibold text-slate-800">Phone:</span> {settings.phone}</div>}
              {settings?.email && <div><span className="font-semibold text-slate-800">Email:</span> {settings.email}</div>}
              {settings?.gstin && <div><span className="font-semibold text-slate-800">GSTIN:</span> {settings.gstin}</div>}
              {settings?.pan && <div><span className="font-semibold text-slate-800">PAN:</span> {settings.pan}</div>}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">TAX INVOICE</h2>
            <div className="mt-2 space-y-1 text-xs">
              <div className="text-slate-600">
                <span className="font-semibold text-slate-800">Invoice No:</span>{' '}
                <span className="font-mono font-bold text-slate-900 text-sm">{invoice.invoiceNumber}</span>
              </div>
              <div className="text-slate-600">
                <span className="font-semibold text-slate-800">Invoice Date:</span> {formatDate(invoice.invoiceDate)}
              </div>
              <div className="text-slate-600">
                <span className="font-semibold text-slate-800">Due Date:</span> {formatDate(invoice.dueDate)}
              </div>
              {invoice.order && (
                <div className="text-slate-600">
                  <span className="font-semibold text-slate-800">Order Ref:</span> #{invoice.order.orderNumber}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer / Bill To Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 pb-6 border-b border-slate-200">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Billed To</h3>
            <div className="font-bold text-slate-900 text-base">{invoice.customer?.name}</div>
            {invoice.customer?.companyName && (
              <div className="text-xs font-semibold text-slate-700">{invoice.customer.companyName}</div>
            )}
            {invoice.customer?.billingAddress && (
              <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                {invoice.customer.billingAddress}
              </p>
            )}
            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
              {invoice.customer?.mobile && <div><span className="font-semibold text-slate-700">Phone:</span> {invoice.customer.mobile}</div>}
              {invoice.customer?.email && <div><span className="font-semibold text-slate-700">Email:</span> {invoice.customer.email}</div>}
              {invoice.customer?.gstin && <div><span className="font-semibold text-slate-700">GSTIN:</span> {invoice.customer.gstin}</div>}
            </div>
          </div>

          {invoice.customer?.shippingAddress && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Ship / Deliver To</h3>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {invoice.customer.shippingAddress}
              </p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-50 text-slate-800 font-bold uppercase text-[11px]">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Item / Service Details</th>
                <th className="py-3 px-3 text-center">Dimensions & Unit</th>
                <th className="py-3 px-3 text-right">Qty / Area</th>
                <th className="py-3 px-3 text-right">Rate</th>
                <th className="py-3 px-3 text-right">Disc %</th>
                <th className="py-3 px-3 text-right">Tax %</th>
                <th className="py-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items?.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    {item.description && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-700">
                    {item.pricingType === 'DIMENSION_RATE' && item.width && item.height ? (
                      <span className="font-mono font-medium">
                        {item.width} × {item.height} {item.unit?.replace('_', ' ')}
                      </span>
                    ) : item.pricingType === 'AREA_RATE' && item.area ? (
                      <span>{item.area} {item.unit?.replace('_', ' ')}</span>
                    ) : (
                      <span>{item.unit?.replace('_', ' ')}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">
                    {formatCurrency(item.rate, currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {item.discount > 0 ? `${item.discount}%` : '-'}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    {item.taxRate > 0 ? `${item.taxRate}%` : '0%'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.totalAmount, currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary & Bank Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
          <div className="space-y-4">
            {/* Payment & Bank Details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-wider">
                Bank & Payment Details
              </h4>
              <div className="space-y-1 text-slate-700">
                {settings?.bankAccountName && <div><span className="font-semibold">Account Name:</span> {settings.bankAccountName}</div>}
                {settings?.bankAccountNumber && <div><span className="font-semibold">Account No:</span> {settings.bankAccountNumber}</div>}
                {settings?.bankIfsc && <div><span className="font-semibold">IFSC Code:</span> {settings.bankIfsc}</div>}
                {settings?.bankName && <div><span className="font-semibold">Bank:</span> {settings.bankName}, {settings.bankBranch}</div>}
                {settings?.upiId && (
                  <div className="mt-2 pt-2 border-t border-slate-200 font-bold text-brand-700">
                    <span>UPI ID:</span> {settings.upiId}
                  </div>
                )}
              </div>
            </div>

            {/* Terms & Conditions */}
            {invoice.terms && (
              <div className="text-xs text-slate-600">
                <h4 className="font-bold text-slate-800 mb-1">Terms & Conditions:</h4>
                <p className="whitespace-pre-line leading-relaxed">{invoice.terms}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-600 py-1">
              <span>Subtotal (Taxable Value):</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(invoice.subtotal, currencySymbol)}</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 py-1">
                <span>Total Discount:</span>
                <span className="font-mono font-semibold">-{formatCurrency(invoice.discountTotal, currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600 py-1">
              <span>GST / Tax Total:</span>
              <span className="font-mono font-semibold text-slate-900">{formatCurrency(invoice.taxTotal, currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 border-t-2 border-slate-900 pt-2 pb-1">
              <span>Grand Total:</span>
              <span className="font-mono text-brand-700">{formatCurrency(invoice.grandTotal, currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700 py-1 font-medium">
              <span>Amount Paid:</span>
              <span className="font-mono">{formatCurrency(invoice.paidAmount || 0, currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
              <span>Balance Due:</span>
              <span className="font-mono">{formatCurrency(invoice.balanceAmount, currencySymbol)}</span>
            </div>

            {/* Authorised signature */}
            <div className="pt-12 text-right">
              <div className="text-xs font-bold text-slate-900">For {settings?.companyName || 'PixelCraft Design Studio'}</div>
              <div className="h-10"></div>
              <div className="text-[11px] text-slate-500 border-t border-slate-300 inline-block pt-1 px-4">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>

        {/* Notes if present */}
        {invoice.notes && (
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 italic">
            <span className="font-semibold text-slate-700">Notes:</span> {invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
}
