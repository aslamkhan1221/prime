'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/components/Toast';
import { formatCurrency, UNIT_OPTIONS, PRICING_TYPES } from '@/lib/utils';
import { calculateLineItem, calculateDocumentTotals } from '@/lib/calculations';
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Building,
  Calendar,
  Save,
  Calculator,
  Percent,
} from 'lucide-react';

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState('DRAFT');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  const [items, setItems] = useState<any[]>([
    {
      itemId: '',
      name: '',
      description: '',
      unit: 'PIECE',
      pricingType: 'QTY_RATE',
      width: null,
      height: null,
      quantity: 1,
      area: null,
      rate: 0,
      discount: 0,
      taxRate: 18,
    },
  ]);

  const { success, error } = useToast();

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [custRes, itemRes, setRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/items?status=ACTIVE'),
          fetch('/api/settings'),
        ]);

        const custData = await custRes.json();
        const itemData = await itemRes.json();
        const setData = await setRes.json();

        setCustomers(custData.customers || []);
        setCatalogItems(itemData.items || []);
        setSettings(setData.settings || {});

        if (defaultCustomerId) {
          setCustomerId(defaultCustomerId);
        } else if (custData.customers?.length > 0) {
          setCustomerId(custData.customers[0].id);
        }

        if (setData.settings?.invoiceTerms) {
          setTerms(setData.settings.invoiceTerms);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [defaultCustomerId]);

  const handleItemSelect = (index: number, itemId: string) => {
    const selected = catalogItems.find((ci) => ci.id === itemId);
    const updated = [...items];
    if (selected) {
      updated[index] = {
        ...updated[index],
        itemId: selected.id,
        name: selected.name,
        description: selected.description || '',
        unit: selected.unit || 'PIECE',
        rate: selected.price || 0,
        taxRate: selected.taxRate ?? 18,
        pricingType:
          selected.unit === 'SQ_FT' || selected.unit === 'FOOT' || selected.unit === 'INCH'
            ? 'DIMENSION_RATE'
            : 'QTY_RATE',
      };
    } else {
      updated[index].itemId = '';
    }
    setItems(updated);
  };

  const updateItemField = (index: number, field: string, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        itemId: '',
        name: '',
        description: '',
        unit: 'PIECE',
        pricingType: 'QTY_RATE',
        width: null,
        height: null,
        quantity: 1,
        area: null,
        rate: 0,
        discount: 0,
        taxRate: 18,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const computedTotals = calculateDocumentTotals(
    items.map((it) => ({
      pricingType: it.pricingType,
      unit: it.unit,
      width: it.width ? Number(it.width) : null,
      height: it.height ? Number(it.height) : null,
      quantity: it.quantity ? Number(it.quantity) : 1,
      area: it.area ? Number(it.area) : null,
      rate: Number(it.rate) || 0,
      discount: Number(it.discount) || 0,
      taxRate: Number(it.taxRate) ?? 18,
    }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      error('Please select a customer');
      return;
    }

    if (items.some((it) => !it.name.trim())) {
      error('All invoice items must have a name');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          invoiceNumber: invoiceNumber || undefined,
          invoiceDate,
          dueDate,
          status,
          notes,
          terms,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      success(`Invoice #${data.invoice.invoiceNumber} created successfully!`);
      router.push(`/invoices/${data.invoice.id}`);
    } catch (err: any) {
      error(err.message || 'Error creating invoice');
    } finally {
      setSaving(false);
    }
  };

  const selectedCustomerObj = customers.find((c) => c.id === customerId);

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Create Tax Invoice</h1>
              <p className="text-xs text-slate-400">Generate professional GST billing for graphic design clients</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Generating...' : 'Save & View Invoice'}</span>
            </button>
          </div>
        </div>

        {/* Invoice Metadata Box */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Customer Picker */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Client / Customer *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
              {selectedCustomerObj && (
                <div className="mt-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                  <div className="text-slate-200 font-semibold">{selectedCustomerObj.name}</div>
                  {selectedCustomerObj.companyName && <div>{selectedCustomerObj.companyName}</div>}
                  {selectedCustomerObj.gstin && <div className="text-brand-300 font-mono">GSTIN: {selectedCustomerObj.gstin}</div>}
                  {selectedCustomerObj.billingAddress && <div className="truncate">{selectedCustomerObj.billingAddress}</div>}
                </div>
              )}
            </div>

            {/* Invoice Number & Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Invoice Number (Auto if blank)
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-1001"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 font-mono focus:border-brand-500"
              />

              <label className="block text-xs font-semibold text-slate-300 mt-3 mb-1">
                Invoice Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-brand-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent to Client</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Dates */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Invoice Date</label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-brand-500"
              />

              <label className="block text-xs font-semibold text-slate-300 mt-3 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Line Items Section with Graphic Dimensions */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Line Items & Measurement Specifications
              </h3>
              <p className="text-[11px] text-slate-400">
                Select items from catalog or calculate dimensional pricing (Width × Height × Rate)
              </p>
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white rounded-xl text-xs font-bold border border-brand-500/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((row, idx) => {
              const lineCalc = calculateLineItem({
                pricingType: row.pricingType,
                unit: row.unit,
                width: row.width ? Number(row.width) : null,
                height: row.height ? Number(row.height) : null,
                quantity: row.quantity ? Number(row.quantity) : 1,
                area: row.area ? Number(row.area) : null,
                rate: Number(row.rate) || 0,
                discount: Number(row.discount) || 0,
                taxRate: Number(row.taxRate) ?? 18,
              });

              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-950/60 border border-slate-800/90 rounded-2xl space-y-3 relative group"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* Item Picker */}
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                        Catalog Quick-Select
                      </label>
                      <select
                        value={row.itemId}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white mb-1.5 focus:border-brand-500"
                      >
                        <option value="">-- Choose from Catalog --</option>
                        {catalogItems.map((ci) => (
                          <option key={ci.id} value={ci.id}>
                            {ci.name} ({ci.category}) - ₹{ci.price}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        placeholder="Item / Service Name *"
                        value={row.name}
                        onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-medium focus:border-brand-500"
                      />
                    </div>

                    {/* Pricing Mode & Unit */}
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                        Pricing Calculation Method
                      </label>
                      <select
                        value={row.pricingType}
                        onChange={(e) => updateItemField(idx, 'pricingType', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white mb-1.5 focus:border-brand-500"
                      >
                        {PRICING_TYPES.map((pt) => (
                          <option key={pt.value} value={pt.value}>
                            {pt.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={row.unit}
                        onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 focus:border-brand-500"
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dimensions / Quantity */}
                    <div className="sm:col-span-5 grid grid-cols-3 gap-2">
                      {row.pricingType === 'DIMENSION_RATE' ? (
                        <>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                              Width ({row.unit?.replace('_', ' ')})
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="W"
                              value={row.width || ''}
                              onChange={(e) => updateItemField(idx, 'width', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                              Height ({row.unit?.replace('_', ' ')})
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="H"
                              value={row.height || ''}
                              onChange={(e) => updateItemField(idx, 'height', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                              Qty (Pcs)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={row.quantity || 1}
                              onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                            />
                          </div>
                        </>
                      ) : row.pricingType === 'AREA_RATE' ? (
                        <>
                          <div className="col-span-2">
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                              Total Area ({row.unit?.replace('_', ' ')})
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Area"
                              value={row.area || ''}
                              onChange={(e) => updateItemField(idx, 'area', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={row.quantity || 1}
                              onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-3">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                            Quantity ({row.unit?.replace('_', ' ')})
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            value={row.quantity || 1}
                            onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rate, Disc, GST, Amount */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80 items-center">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Rate (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={row.rate || ''}
                        onChange={(e) => updateItemField(idx, 'rate', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Disc %</label>
                      <input
                        type="number"
                        step="0.5"
                        value={row.discount || ''}
                        onChange={(e) => updateItemField(idx, 'discount', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">GST %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={row.taxRate ?? 18}
                        onChange={(e) => updateItemField(idx, 'taxRate', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-2 flex items-center justify-between pl-2">
                      <div>
                        <div className="text-[10px] text-slate-400">
                          {row.pricingType === 'DIMENSION_RATE'
                            ? `Computed Area: ${lineCalc.effectiveQuantity} sq units`
                            : `Tax: ${formatCurrency(lineCalc.taxAmount)}`}
                        </div>
                        <div className="text-sm font-black text-brand-400 font-mono">
                          {formatCurrency(lineCalc.totalAmount)}
                        </div>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terms & Financial Summary Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Client Notes (Visible on Invoice)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business! Design approved via email..."
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Grand Totals Summary Card */}
          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">
              Financial Summary Breakdown
            </h4>
            <div className="flex justify-between text-slate-400">
              <span>Subtotal (Taxable Value):</span>
              <span className="font-mono text-white font-semibold">{formatCurrency(computedTotals.subtotal)}</span>
            </div>
            {computedTotals.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Total Discount:</span>
                <span className="font-mono font-semibold">-{formatCurrency(computedTotals.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>GST / Tax Total:</span>
              <span className="font-mono text-white font-semibold">{formatCurrency(computedTotals.taxTotal)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-brand-400 pt-3 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="font-mono">{formatCurrency(computedTotals.grandTotal)}</span>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 transition transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Creating Invoice...' : 'Generate & Save Invoice'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0f19] p-8 text-center text-slate-500">Loading invoice form...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
