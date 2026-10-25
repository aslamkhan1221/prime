'use client';

import React from 'react';
import { formatCurrency, formatDate, numberToWords } from '@/lib/utils';
import { Printer, ArrowLeft, Printer as PrinterIcon } from 'lucide-react';

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
  const grandTotal = Number(invoice?.grandTotal) || 0;
  const balanceDue = invoice?.balanceAmount !== undefined ? Number(invoice.balanceAmount) : grandTotal;
  const totalInWords = numberToWords(grandTotal);

  // Fallbacks matching Prime Print & Services
  const companyName = settings?.companyName || 'Prime Print & Services';
  const companyId = settings?.companyId || 'PRIME';
  const companyAddress =
    settings?.address ||
    '23/41/1068, Vaishali Nagar, Jaswantsingpura,\nCIDCO N-8, Azad Chowk to TV Center Road\nAurangabad Maharashtra 431001\nIndia';
  const companyEmail = settings?.email || 'accounts@primeprint.in';
  const companyWebsite = settings?.website || 'https://primeprint.in/';
  const reviewUrl = settings?.reviewUrl || 'https://g.page/r/CfUhh8jFFKjlEAo/review';

  const defaultTerms =
    settings?.invoiceTerms ||
    '1) Bill must be paid within 10 days form the date of receipt.\n2) Any Queries/Corrections will be entertained only within 10 days form the date of Submission of the bill\nNo Corrections will be entertained thereafter.';

  const defaultNotes =
    invoice?.notes ||
    `Thanks for your business.\n${companyName} would love your feedback. Post a review to our profile.\n${reviewUrl}`;

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <span className="text-sm font-bold text-slate-900">
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
            {invoice.status?.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Sheet matching exact PDF layout */}
      <div className="invoice-printable bg-white text-black p-8 sm:p-12 shadow-2xl max-w-[850px] mx-auto border border-slate-300 font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full">
        {/* Top Header: Company Info on Left, TAX INVOICE on Right */}
        <div className="flex justify-between items-start pb-3">
          <div className="flex items-start gap-4">
            <img
              src={settings?.logoUrl || '/logo.png'}
              alt={companyName}
              className="h-14 sm:h-16 w-auto object-contain shrink-0 max-w-[200px]"
            />
            <div>
              <h1 className="text-base font-extrabold text-black uppercase tracking-tight">
                {companyName}
              </h1>
              <div className="text-[11px] text-slate-800 leading-tight mt-0.5 space-y-0.5">
                {companyId && (
                  <div>
                    <span className="font-semibold">Company ID :</span> {companyId}
                  </div>
                )}
                <div className="whitespace-pre-line text-slate-700">{companyAddress}</div>
                {companyEmail && <div>{companyEmail}</div>}
                {companyWebsite && (
                  <div>
                    <a
                      href={companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-800 underline hover:text-black"
                    >
                      {companyWebsite}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-2xl sm:text-3xl font-black text-black tracking-wider uppercase">
              TAX INVOICE
            </h2>
          </div>
        </div>

        {/* Signature CMYK Process Print Stripe from Logo */}
        <div className="cmyk-stripe h-1 w-full rounded-full my-2.5 opacity-90" />

        {/* Invoice Metadata Box matching PDF format */}
        <div className="border border-slate-400 mt-2 text-xs">
          <div className="grid grid-cols-2 p-2.5 divide-x divide-slate-300">
            <div className="space-y-1 pr-4">
              <div className="flex">
                <span className="w-24 font-bold text-slate-800">#</span>
                <span className="font-bold text-black">: {invoice.invoiceNumber}</span>
              </div>
              <div className="flex">
                <span className="w-24 font-bold text-slate-800">Invoice Date</span>
                <span>: {formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="flex">
                <span className="w-24 font-bold text-slate-800">Terms</span>
                <span>: {invoice.terms ? 'Due on Receipt' : 'Due on Receipt'}</span>
              </div>
              <div className="flex">
                <span className="w-24 font-bold text-slate-800">Due Date</span>
                <span>: {formatDate(invoice.dueDate)}</span>
              </div>
            </div>

            <div className="space-y-1 pl-4 text-slate-600">
              {invoice.order && (
                <div className="flex">
                  <span className="w-24 font-bold text-slate-800">Order Ref</span>
                  <span>: #{invoice.order.orderNumber}</span>
                </div>
              )}
              {settings?.gstin && (
                <div className="flex">
                  <span className="w-24 font-bold text-slate-800">GSTIN</span>
                  <span>: {settings.gstin}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Ship To Boxes matching PDF */}
        <div className="border-x border-b border-slate-400 text-xs">
          <div className="grid grid-cols-2 divide-x divide-slate-400">
            {/* Bill To */}
            <div className="p-2.5">
              <div className="font-bold text-slate-900 mb-1">Bill To</div>
              <div className="font-bold text-black text-xs">
                {invoice.customer?.companyName || invoice.customer?.name}
              </div>
              {invoice.customer?.companyName && invoice.customer?.name && (
                <div className="text-[11px] text-slate-700">{invoice.customer.name}</div>
              )}
              <div className="text-[11px] text-slate-700 whitespace-pre-line mt-0.5 leading-relaxed">
                {invoice.customer?.billingAddress || 'Lucky Tower, Kausar Park, Naregaon,\nAurangabad 431007 Maharashtra\nIndia'}
              </div>
              {invoice.customer?.gstin && (
                <div className="text-[10px] text-slate-600 mt-1">
                  GSTIN: <span className="font-semibold text-black">{invoice.customer.gstin}</span>
                </div>
              )}
            </div>

            {/* Ship To */}
            <div className="p-2.5">
              <div className="font-bold text-slate-900 mb-1">Ship To</div>
              <div className="font-bold text-black text-xs">
                {invoice.customer?.companyName || invoice.customer?.name}
              </div>
              <div className="text-[11px] text-slate-700 whitespace-pre-line mt-0.5 leading-relaxed">
                {invoice.customer?.shippingAddress ||
                  invoice.customer?.billingAddress ||
                  'Lucky Tower, Kausar Park, Naregaon,\nAurangabad 431007 Maharashtra\nIndia'}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table matching exact PDF grid and typography */}
        <div className="mt-4 border border-slate-400">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-900 font-bold border-b border-slate-400 text-[11px]">
                <th className="py-2 px-2 text-center border-r border-slate-400 w-10">#</th>
                <th className="py-2 px-3 border-r border-slate-400">Item &amp; Description</th>
                <th className="py-2 px-3 text-right border-r border-slate-400 w-24">Qty</th>
                <th className="py-2 px-3 text-right border-r border-slate-400 w-24">Rate</th>
                <th className="py-2 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400">
              {invoice.items?.map((item: any, idx: number) => {
                const quantityNum = Number(item.quantity) || 1;
                const rateNum = Number(item.rate) || 0;
                const amountNum = Number(item.totalAmount) || quantityNum * rateNum;
                const unitLabel = item.unit || 'pcs';

                return (
                  <tr key={item.id || idx} className="align-top">
                    <td className="py-2.5 px-2 text-center text-slate-700 border-r border-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-400">
                      <div className="font-bold text-black text-xs leading-tight">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-[11px] text-slate-600 mt-1 whitespace-pre-line leading-relaxed font-normal">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-slate-400 font-mono">
                      <div className="text-black font-semibold">
                        {quantityNum.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-600 font-sans mt-0.5">
                        {unitLabel}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-slate-400 font-mono text-black">
                      {rateNum.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-black">
                      {amountNum.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Section matching PDF */}
        <div className="border-x border-b border-slate-400 text-xs">
          <div className="grid grid-cols-12 divide-x divide-slate-400">
            {/* Left Area: Total in words, Notes, Terms & Conditions */}
            <div className="col-span-7 p-3 space-y-3">
              {/* Total in words */}
              <div>
                <span className="font-bold text-slate-800 text-[11px] block">Total In Words</span>
                <span className="text-black font-semibold text-xs italic">
                  {totalInWords}
                </span>
              </div>

              {/* Notes */}
              {defaultNotes && (
                <div className="pt-2 border-t border-slate-300 text-[11px]">
                  <span className="font-bold text-slate-800 block mb-0.5">Notes</span>
                  <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {defaultNotes}
                  </div>
                </div>
              )}

              {/* Terms & Conditions */}
              {defaultTerms && (
                <div className="pt-2 border-t border-slate-300 text-[11px]">
                  <span className="font-bold text-slate-800 block mb-0.5">Terms &amp; Conditions</span>
                  <div className="text-slate-700 whitespace-pre-line leading-relaxed text-[10.5px]">
                    {defaultTerms}
                  </div>
                </div>
              )}
            </div>

            {/* Right Area: Sub Total, Total, Balance Due, Authorized Signature */}
            <div className="col-span-5 flex flex-col justify-between">
              {/* Amounts Table */}
              <div className="divide-y divide-slate-300">
                <div className="flex justify-between items-center py-2 px-3 text-xs">
                  <span className="font-semibold text-slate-800">Sub Total</span>
                  <span className="font-mono font-bold text-black">
                    {(Number(invoice.subtotal) || grandTotal).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 px-3 text-sm font-black bg-slate-50/80">
                  <span className="text-black">Total</span>
                  <span className="font-mono text-black">
                    {currencySymbol}
                    {grandTotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 px-3 text-xs font-bold">
                  <span className="text-slate-800">Balance Due</span>
                  <span className="font-mono text-black font-bold">
                    {currencySymbol}
                    {balanceDue.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Authorized Signature */}
              <div className="p-4 pt-16 text-center border-t border-slate-300">
                <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
                <div className="text-xs font-semibold text-slate-800">Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Page Number & Powered By */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-3 mt-1">
          <div>POWERED BY PRIME STUDIO</div>
          <div>1</div>
        </div>
      </div>
    </div>
  );
}
