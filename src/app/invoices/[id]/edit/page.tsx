'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/components/Toast';
import { formatCurrency, UNIT_OPTIONS, PRICING_TYPES } from '@/lib/utils';
import { calculateLineItem, calculateDocumentTotals } from '@/lib/calculations';
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [customerId, setCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const { success, error } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, itemRes, invRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/items?status=ACTIVE'),
          fetch(`/api/invoices/${params.id}`),
        ]);

        const custData = await custRes.json();
        const itemData = await itemRes.json();
        const invData = await invRes.json();

        setCustomers(custData.customers || []);
        setCatalogItems(itemData.items || []);

        if (invData.invoice) {
          const inv = invData.invoice;
          setCustomerId(inv.customerId);
          setInvoiceNumber(inv.invoiceNumber);
          setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
          setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
          setStatus(inv.status);
          setNotes(inv.notes || '');
          setTerms(inv.terms || '');
          setItems(
            inv.items.map((it: any) => ({
              itemId: it.itemId || '',
              name: it.name,
              description: it.description || '',
              unit: it.unit || 'PIECE',
              pricingType: it.pricingType || 'QTY_RATE',
              width: it.width,
              height: it.height,
              quantity: it.quantity || 1,
              area: it.area,
              rate: it.rate || 0,
              discount: it.discount || 0,
              taxRate: it.taxRate ?? 18,
            }))
          );
        }
      } catch (err: any) {
        error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

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
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          invoiceNumber,
          invoiceDate,
          dueDate,
          status,
          notes,
          terms,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update invoice');

      success('Invoice updated successfully');
      router.push(`/invoices/${params.id}`);
    } catch (err: any) {
      error(err.message || 'Error updating invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-500">Loading invoice...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href={`/invoices/${params.id}`}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Edit Invoice #{invoiceNumber}
              </h1>
              <p className="text-xs text-slate-400">Modify items, dimensions, terms, and tax details</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/invoices/${params.id}`}
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
              <span>{saving ? 'Updating...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Invoice Metadata Box */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Client / Customer *
              </label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-brand-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white uppercase font-mono focus:border-brand-500"
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
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

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

        {/* Dynamic Line Items Section */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Line Items & Dimensions
            </h3>
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
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                        Catalog Item
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

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                        Pricing Logic & Unit
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

                    <div className="sm:col-span-5 grid grid-cols-3 gap-2">
                      {row.pricingType === 'DIMENSION_RATE' ? (
                        <>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">Width</label>
                            <input
                              type="number"
                              step="0.1"
                              value={row.width || ''}
                              onChange={(e) => updateItemField(idx, 'width', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">Height</label>
                            <input
                              type="number"
                              step="0.1"
                              value={row.height || ''}
                              onChange={(e) => updateItemField(idx, 'height', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">Qty</label>
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
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">Area</label>
                            <input
                              type="number"
                              step="0.01"
                              value={row.area || ''}
                              onChange={(e) => updateItemField(idx, 'area', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-semibold mb-1">Qty</label>
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
                          <label className="block text-[10px] text-slate-400 font-semibold mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={row.quantity || 1}
                            onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-800 items-center">
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
                        <div className="text-[10px] text-slate-400">Total</div>
                        <div className="text-sm font-black text-brand-400 font-mono">
                          {formatCurrency(lineCalc.totalAmount)}
                        </div>
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
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

        {/* Footer & Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Client Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Terms & Conditions</label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-brand-500"
              />
            </div>
          </div>

          <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">
              Financial Summary Breakdown
            </h4>
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
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
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
