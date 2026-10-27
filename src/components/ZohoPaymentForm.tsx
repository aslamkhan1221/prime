'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Settings,
  Upload,
  ChevronDown,
  X,
  FileText,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';

interface ZohoPaymentFormProps {
  initialInvoiceId?: string;
  paymentIdToEdit?: string;
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: (payment: any) => void;
}

export function ZohoPaymentForm({
  initialInvoiceId,
  paymentIdToEdit,
  isModal = false,
  onClose,
  onSuccess,
}: ZohoPaymentFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Data
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields (Exact Zoho Books fields)
  const [paymentNumber, setPaymentNumber] = useState('1');
  const [amountReceived, setAmountReceived] = useState<number | string>('');
  const [bankCharges, setBankCharges] = useState<number | string>('');
  const [tdsDeducted, setTdsDeducted] = useState(false);
  const [tdsAmount, setTdsAmount] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentReceivedOn, setPaymentReceivedOn] = useState('');
  const [depositTo, setDepositTo] = useState('Petty Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; size: number; data?: string }>>([]);

  // Modals & Popovers
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showNumberSettings, setShowNumberSettings] = useState(false);
  const [numberMode, setNumberMode] = useState<'auto' | 'manual'>('auto');
  const [showPanModal, setShowPanModal] = useState(false);
  const [customerPan, setCustomerPan] = useState('');
  const [savingPan, setSavingPan] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. If editing an existing payment
        if (paymentIdToEdit) {
          const res = await fetch(`/api/payments/${paymentIdToEdit}`);
          const data = await res.json();
          if (data.payment) {
            const p = data.payment;
            setPaymentNumber(p.paymentNumber || '1');
            setAmountReceived(p.amount || '');
            setBankCharges(p.bankCharges || '');
            setTdsDeducted(Boolean(p.tdsDeducted));
            setPaymentDate(p.paymentDate ? p.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0]);
            setPaymentReceivedOn(p.paymentReceivedOn ? p.paymentReceivedOn.split('T')[0] : '');
            setPaymentMode(p.paymentMethod || 'Cash');
            setDepositTo(p.depositTo || 'Petty Cash');
            setReferenceNumber(p.referenceNumber || '');
            setNotes(p.notes || '');
            if (p.attachments) {
              try {
                setAttachments(JSON.parse(p.attachments));
              } catch {
                setAttachments([]);
              }
            }
            if (p.invoice) {
              setSelectedInvoice(p.invoice);
              if (p.invoice.customer?.pan) {
                setCustomerPan(p.invoice.customer.pan);
              }
            }
          }
          setLoading(false);
          return;
        }

        // 2. Load invoices for selection or match initialInvoiceId
        const res = await fetch('/api/invoices');
        const data = await res.json();
        const list = data.invoices || [];
        setInvoices(list);

        let targetInvoice = null;
        if (initialInvoiceId) {
          targetInvoice = list.find((i: any) => i.id === initialInvoiceId);
        } else {
          // Default to first invoice with balance
          targetInvoice = list.find((i: any) => i.balanceAmount > 0 && i.status !== 'CANCELLED') || list[0];
        }

        if (targetInvoice) {
          selectInvoice(targetInvoice);
        }

        // Auto-fetch count for next payment number
        const payRes = await fetch('/api/payments');
        const payData = await payRes.json();
        const nextNum = (payData.payments?.length || 0) + 1;
        setPaymentNumber(String(nextNum));
      } catch (err: any) {
        console.error('Error loading payment form data:', err);
        error('Failed to load invoice information');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [initialInvoiceId, paymentIdToEdit]);

  const selectInvoice = (inv: any) => {
    setSelectedInvoice(inv);
    setAmountReceived(inv.balanceAmount > 0 ? inv.balanceAmount : inv.grandTotal || 0);
    if (inv.customer?.pan) {
      setCustomerPan(inv.customer.pan);
    } else {
      setCustomerPan('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      error('You can upload a maximum of 5 files');
      return;
    }

    const newAttachments = [...attachments];
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        error(`File "${file.name}" exceeds 5MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        newAttachments.push({
          name: file.name,
          size: file.size,
          data: uploadEvent.target?.result as string,
        });
        setAttachments([...newAttachments]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePan = async () => {
    if (!selectedInvoice?.customer?.id) return;
    setSavingPan(true);
    try {
      const res = await fetch(`/api/customers/${selectedInvoice.customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedInvoice.customer,
          pan: customerPan.trim().toUpperCase(),
        }),
      });
      if (!res.ok) throw new Error('Failed to update PAN');
      success('Customer PAN updated successfully');
      setShowPanModal(false);
      // Update in state
      setSelectedInvoice((prev: any) => ({
        ...prev,
        customer: { ...prev.customer, pan: customerPan.trim().toUpperCase() },
      }));
    } catch (err: any) {
      error(err.message || 'Error updating PAN');
    } finally {
      setSavingPan(false);
    }
  };

  const handleSubmit = async (status: 'PAID' | 'DRAFT') => {
    if (!selectedInvoice) {
      error('Please select an invoice');
      return;
    }

    const numAmount = Number(amountReceived);
    if (isNaN(numAmount) || numAmount <= 0) {
      error('Please enter a valid Amount Received greater than 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        invoiceId: selectedInvoice.id,
        paymentNumber: paymentNumber.trim() || undefined,
        amount: numAmount,
        bankCharges: Number(bankCharges) || 0,
        tdsDeducted,
        paymentDate,
        paymentReceivedOn: paymentReceivedOn || null,
        paymentMethod: paymentMode,
        depositTo,
        referenceNumber: referenceNumber.trim() || null,
        notes: notes.trim() || null,
        status,
        attachments: attachments.map((a) => ({ name: a.name, size: a.size })),
      };

      let res;
      if (paymentIdToEdit) {
        res = await fetch(`/api/payments/${paymentIdToEdit}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save payment record');

      success(
        status === 'DRAFT'
          ? `Payment saved as Draft (#${data.payment?.paymentNumber || paymentNumber})`
          : `Payment of ${formatCurrency(numAmount)} recorded successfully!`
      );

      if (onSuccess) {
        onSuccess(data.payment);
      } else {
        router.push(selectedInvoice ? `/invoices/${selectedInvoice.id}` : '/payments');
      }
    } catch (err: any) {
      error(err.message || 'Error saving payment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Loading payment record...</p>
      </div>
    );
  }

  const customer = selectedInvoice?.customer || {};

  return (
    <div className={`bg-white ${isModal ? '' : 'rounded-xl shadow-sm border border-slate-200'} text-slate-800`}>
      {/* Header bar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!isModal && (
            <button
              type="button"
              onClick={() => router.back()}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Payment for {selectedInvoice?.invoiceNumber || 'INV-000001'}
            </h1>
            {selectedInvoice && (
              <p className="text-xs text-slate-500 mt-0.5">
                Invoice Total: <span className="font-semibold">{formatCurrency(selectedInvoice.grandTotal)}</span> | Outstanding Due:{' '}
                <span className="font-semibold text-rose-600">{formatCurrency(selectedInvoice.balanceAmount)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Change invoice dropdown if multiple invoices exist */}
        {!paymentIdToEdit && invoices.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Switch Invoice:</span>
            <select
              value={selectedInvoice?.id || ''}
              onChange={(e) => {
                const found = invoices.find((i) => i.id === e.target.value);
                if (found) selectInvoice(found);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  #{inv.invoiceNumber} - {inv.customer?.name} (Due: ₹{inv.balanceAmount})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Form Fields matching Zoho Books */}
      <div className="p-4 sm:p-8 space-y-6 max-w-4xl">
        {/* Customer Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
          <label className="sm:col-span-3 text-xs sm:text-sm font-semibold text-red-700">
            Customer Name<span className="text-red-600">*</span>
          </label>
          <div className="sm:col-span-9 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              readOnly
              value={customer.name || customer.companyName || 'Select Customer'}
              className="w-full sm:w-80 px-3 py-2 bg-slate-50/70 border border-slate-300 rounded-md text-sm text-slate-800 font-medium focus:outline-none cursor-default"
            />
            {customer.name && (
              <button
                type="button"
                onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                className="px-3 py-1.5 bg-[#3f4a59] hover:bg-[#2f3946] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition shadow-sm whitespace-nowrap"
              >
                <span>{customer.name}&apos;s Details</span>
                <span className="text-[10px] font-bold">&gt;</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer Details Drawer / Flyout */}
        {showCustomerDetails && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                Customer Profile & Receivables
              </span>
              <button
                onClick={() => setShowCustomerDetails(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-semibold">Primary Contact</span>
                <div className="font-semibold text-slate-800 text-sm mt-0.5">{customer.name}</div>
                {customer.companyName && <div className="text-slate-600">{customer.companyName}</div>}
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-semibold">Contact Details</span>
                <div className="text-slate-700 mt-0.5">{customer.mobile || 'No phone'}</div>
                <div className="text-slate-600">{customer.email || 'No email'}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-semibold">Tax Information</span>
                <div className="text-slate-700 mt-0.5">GSTIN: {customer.gstin || 'Unregistered'}</div>
                <div className="text-slate-700">PAN: {customer.pan || 'Not Provided'}</div>
              </div>
            </div>
            {customer.billingAddress && (
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-slate-400 uppercase text-[10px] block font-semibold">Billing Address</span>
                <p className="text-slate-600 whitespace-pre-line mt-0.5">{customer.billingAddress}</p>
              </div>
            )}
          </div>
        )}

        {/* Payment # */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
          <label className="sm:col-span-3 text-xs sm:text-sm font-semibold text-red-700">
            Payment #<span className="text-red-600">*</span>
          </label>
          <div className="sm:col-span-9 flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                required
                value={paymentNumber}
                onChange={(e) => setPaymentNumber(e.target.value)}
                className="w-full px-3 py-2 pr-9 bg-white border border-slate-300 rounded-md text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNumberSettings(!showNumberSettings)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded transition"
                title="Payment Number Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Payment Number Settings Dropdown / Modal */}
        {showNumberSettings && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs max-w-sm ml-0 sm:ml-[25%] space-y-2">
            <div className="font-bold text-slate-700 flex justify-between items-center">
              <span>Configure Payment Number</span>
              <button onClick={() => setShowNumberSettings(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 pt-1 text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="numMode"
                  checked={numberMode === 'auto'}
                  onChange={() => setNumberMode('auto')}
                  className="text-blue-600"
                />
                <span>Auto-generate sequential numbers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="numMode"
                  checked={numberMode === 'manual'}
                  onChange={() => setNumberMode('manual')}
                  className="text-blue-600"
                />
                <span>Enter manual receipt numbers</span>
              </label>
            </div>
          </div>
        )}

        {/* Amount Received (INR)* and Bank Charges */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start">
          <label className="sm:col-span-3 text-xs sm:text-sm font-semibold text-red-700 pt-2">
            Amount Received (INR)<span className="text-red-600">*</span>
          </label>
          <div className="sm:col-span-4">
            <input
              type="number"
              step="0.01"
              required
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-bold text-slate-900 font-mono text-right sm:text-left focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {/* PAN underneath Amount Received */}
            <div className="mt-1.5 text-xs text-slate-600 flex items-center gap-1.5">
              <span className="font-medium text-slate-500">PAN:</span>
              {customerPan ? (
                <span className="font-mono font-semibold text-slate-800">{customerPan}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPanModal(true)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Add PAN
                </button>
              )}
            </div>
          </div>

          <label className="sm:col-span-2 text-xs sm:text-sm font-medium text-slate-700 pt-2 sm:text-right">
            Bank Charges (if any)
          </label>
          <div className="sm:col-span-3">
            <input
              type="number"
              step="0.01"
              value={bankCharges}
              onChange={(e) => setBankCharges(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* PAN Modal */}
        {showPanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Add Customer PAN</h3>
                <button onClick={() => setShowPanModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Permanent Account Number (PAN)</label>
                <input
                  type="text"
                  maxLength={10}
                  value={customerPan}
                  onChange={(e) => setCustomerPan(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPanModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePan}
                  disabled={savingPan || !customerPan.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
                >
                  {savingPan ? 'Saving...' : 'Save PAN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TDS Deducted? */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
          <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700">
            TDS Deducted?
          </label>
          <div className="sm:col-span-9 flex items-center gap-6 text-sm text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tds"
                checked={!tdsDeducted}
                onChange={() => setTdsDeducted(false)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span>No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tds"
                checked={tdsDeducted}
                onChange={() => setTdsDeducted(true)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span>Yes, Income TDS</span>
            </label>
          </div>
        </div>

        {tdsDeducted && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <label className="sm:col-span-3 text-xs font-medium text-blue-900">
              TDS Amount (INR)
            </label>
            <div className="sm:col-span-4">
              <input
                type="number"
                step="0.01"
                value={tdsAmount}
                onChange={(e) => setTdsAmount(e.target.value)}
                placeholder="TDS Amount deducted"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* Payment Date* and Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
          <label className="sm:col-span-3 text-xs sm:text-sm font-semibold text-red-700">
            Payment Date<span className="text-red-600">*</span>
          </label>
          <div className="sm:col-span-4">
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <label className="sm:col-span-2 text-xs sm:text-sm font-medium text-slate-700 sm:text-right">
            Payment Mode
          </label>
          <div className="sm:col-span-3">
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="Check">Check / Cheque</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Bank Remittance">Bank Remittance</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Payment Received On and Deposit To* */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
          <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700">
            Payment Received On
          </label>
          <div className="sm:col-span-4">
            <input
              type="date"
              value={paymentReceivedOn}
              onChange={(e) => setPaymentReceivedOn(e.target.value)}
              placeholder="dd/MM/yyyy"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <label className="sm:col-span-2 text-xs sm:text-sm font-semibold text-red-700 sm:text-right">
            Deposit To<span className="text-red-600">*</span>
          </label>
          <div className="sm:col-span-3">
            <select
              required
              value={depositTo}
              onChange={(e) => setDepositTo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Petty Cash">Petty Cash</option>
              <option value="Undeposited Funds">Undeposited Funds</option>
              <option value="Bank Account">Bank Account (HDFC Bank)</option>
              <option value="Cash">Cash in Hand</option>
            </select>
          </div>
        </div>

        {/* Reference# and Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start">
          <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700 pt-2">
            Reference#
          </label>
          <div className="sm:col-span-4">
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UTR / UPI Ref / Cheque #"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <label className="sm:col-span-2 text-xs sm:text-sm font-medium text-slate-700 pt-2 sm:text-right">
            Notes
          </label>
          <div className="sm:col-span-3">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add payment notes or remarks..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
            />
          </div>
        </div>

        {/* Attachments */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-start pt-2">
          <label className="sm:col-span-3 text-xs sm:text-sm font-medium text-slate-700 pt-2">
            Attachments
          </label>
          <div className="sm:col-span-9 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md flex items-center gap-2 shadow-xs transition"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload File</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <p className="text-[11px] text-slate-400">
              You can upload a maximum of 5 files, 5MB each
            </p>

            {/* Attached file tags */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons (Matching Zoho Books: Save as Draft, Save as Paid, Cancel) */}
      <div className="p-4 sm:p-6 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSubmit('DRAFT')}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-md border border-slate-300 shadow-xs transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => handleSubmit('PAID')}
          className="px-5 py-2 bg-[#1366d9] hover:bg-[#0f54b3] text-white text-xs sm:text-sm font-bold rounded-md shadow-sm transition disabled:opacity-50"
        >
          {saving ? 'Recording...' : 'Save as Paid'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            else router.back();
          }}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-600 text-xs sm:text-sm font-medium rounded-md border border-slate-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
