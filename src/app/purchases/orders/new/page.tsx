'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/components/Toast';
import {
  FileCheck2,
  Building2,
  Calendar,
  Plus,
  Trash2,
  ArrowLeft,
  X,
  Upload,
  Info,
  Check,
  Search,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LineItem {
  id: string;
  name: string;
  description: string;
  account: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
  totalAmount: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [vendors, setVendors] = useState<any[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state matching Screenshot 2
  const [vendorId, setVendorId] = useState('');
  const [deliveryAddressType, setDeliveryAddressType] = useState<'ORGANIZATION' | 'CUSTOMER'>('ORGANIZATION');
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Prime Print & Services\n23/41/1068, Vaishali Nagar, Jaswantsingpura,\nCIDCO N-8, Aurangabad Maharashtra 431001, India'
  );
  const [poNumber, setPoNumber] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  const [shipmentPreference, setShipmentPreference] = useState('');

  // Items table
  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      name: '',
      description: '',
      account: 'Cost of Goods Sold',
      quantity: 1,
      rate: 0,
      discount: 0,
      taxRate: 18,
      totalAmount: 0,
    },
  ]);

  // Totals
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxType, setTaxType] = useState<'TDS' | 'TCS'>('TDS');
  const [taxRate, setTaxRate] = useState(0);
  const [adjustment, setAdjustment] = useState(0);

  const [notes, setNotes] = useState('Will be displayed on purchase order.');
  const [terms, setTerms] = useState(
    '1. Material must adhere to approved specifications.\n2. Invoices must reference this PO number.\n3. Goods delivered past deadline may be rejected.'
  );

  // Fetch vendors and catalog items
  useEffect(() => {
    async function loadData() {
      try {
        const [vRes, iRes, poRes] = await Promise.all([
          fetch('/api/purchases/vendors'),
          fetch('/api/items'),
          fetch('/api/purchases/orders'),
        ]);

        const vData = await vRes.json();
        const iData = await iRes.json();
        const poData = await poRes.json();

        if (vData.vendors) {
          setVendors(vData.vendors);
          if (vData.vendors.length > 0) setVendorId(vData.vendors[0].id);
        }
        if (iData.items) setItemsCatalog(iData.items);

        // Generate PO number
        const nextCount = (poData.orders?.length || 0) + 1;
        setPoNumber(`PO-${String(nextCount).padStart(5, '0')}`);
      } catch (err) {
        console.error('Failed to load PO initial data:', err);
      } finally {
        setLoadingVendors(false);
      }
    }
    loadData();
  }, []);

  // Update line item
  const updateItem = (id: string, field: string, val: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };

        // Recalculate item total: (qty * rate) - discount + tax
        const qty = Number(updated.quantity) || 0;
        const rate = Number(updated.rate) || 0;
        const disc = Number(updated.discount) || 0;
        const base = Math.max(0, qty * rate - disc);
        const tax = (base * (Number(updated.taxRate) || 0)) / 100;
        updated.totalAmount = base + tax;
        return updated;
      })
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 'item-' + (prev.length + 1) + '-' + Math.random().toString(36).substring(2, 6),
        name: '',
        description: '',
        account: 'Cost of Goods Sold',
        quantity: 1,
        rate: 0,
        discount: 0,
        taxRate: 18,
        totalAmount: 0,
      },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxTotal = items.reduce((acc, i) => {
    const base = (Number(i.quantity) || 0) * (Number(i.rate) || 0) - (Number(i.discount) || 0);
    return acc + (Math.max(0, base) * (Number(i.taxRate) || 0)) / 100;
  }, 0);
  const grandTotal = Math.max(0, taxableAmount + taxTotal + Number(adjustment));

  const handleSavePO = async (status: 'DRAFT' | 'ISSUED') => {
    if (!vendorId) {
      error('Please select a vendor');
      return;
    }

    const validItems = items.filter((i) => i.name.trim().length > 0);
    if (validItems.length === 0) {
      error('Please enter at least one item with a valid name');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/purchases/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poNumber,
          vendorId,
          referenceNumber,
          orderDate,
          deliveryDate: deliveryDate || null,
          deliveryAddressType,
          deliveryAddress,
          paymentTerms,
          shipmentPreference,
          items: validItems,
          subtotal,
          discount: discountAmount,
          taxTotal,
          adjustment,
          total: grandTotal,
          status,
          notes,
          terms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save purchase order');

      success(`Purchase Order #${poNumber} created successfully!`);
      router.push('/purchases/orders');
    } catch (err: any) {
      error(err.message || 'Error saving purchase order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/purchases/orders"
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-xl border border-brand-200">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Purchase Order</h1>
            </div>
          </div>

          <Link
            href="/purchases/orders"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </Link>
        </div>

        {/* PO Form matching Screenshot 2 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-xs">
          {/* Vendor Name */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <label className="md:col-span-3 font-semibold text-rose-600 flex items-center gap-1">
              <span>Vendor Name*</span>
            </label>
            <div className="md:col-span-7 flex items-center gap-2">
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">Select a Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.displayName} {v.companyName ? `(${v.companyName})` : ''}
                  </option>
                ))}
              </select>
              <Link
                href="/purchases/vendors"
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition shrink-0"
                title="Add Vendor"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-3 border-t border-slate-100">
            <label className="md:col-span-3 font-semibold text-rose-600">
              Delivery Address*
            </label>
            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center gap-6 font-medium text-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryAddressType"
                    checked={deliveryAddressType === 'ORGANIZATION'}
                    onChange={() => setDeliveryAddressType('ORGANIZATION')}
                    className="text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Organization</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryAddressType"
                    checked={deliveryAddressType === 'CUSTOMER'}
                    onChange={() => setDeliveryAddressType('CUSTOMER')}
                    className="text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Customer</span>
                </label>
              </div>

              <textarea
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* PO Number, Reference, Date, Delivery Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block font-semibold text-rose-600 mb-1">Purchase Order#*</label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference#</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. Quotation# 9821"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Delivery Date</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          {/* Payment Terms & Shipment Preference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shipment Preference</label>
              <select
                value={shipmentPreference}
                onChange={(e) => setShipmentPreference(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
              >
                <option value="">Choose the shipment preference</option>
                <option value="Standard Road Transport">Standard Road Transport</option>
                <option value="Express Cargo">Express Cargo / Courier</option>
                <option value="Self Pickup (Aurangabad)">Self Pickup (Aurangabad)</option>
              </select>
            </div>
          </div>

          {/* ITEM TABLE (Matching Screenshot 2) */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Item Table</h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 w-56">Item Details</th>
                      <th className="py-3 px-3 w-36">Account</th>
                      <th className="py-3 px-2 w-20 text-right">Quantity</th>
                      <th className="py-3 px-2 w-24 text-right">Rate</th>
                      <th className="py-3 px-2 w-20 text-right">Disc. (₹)</th>
                      <th className="py-3 px-2 w-20 text-right">Tax (%)</th>
                      <th className="py-3 px-3 w-28 text-right">Amount</th>
                      <th className="py-3 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="align-top hover:bg-slate-50/50">
                        {/* Item Details */}
                        <td className="p-2 space-y-1">
                          <input
                            type="text"
                            placeholder="Type or select an item..."
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-1 focus:ring-brand-500"
                          />
                          <input
                            type="text"
                            placeholder="Description / size / GSM..."
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded text-slate-600"
                          />
                        </td>

                        {/* Account */}
                        <td className="p-2">
                          <select
                            value={item.account}
                            onChange={(e) => updateItem(item.id, 'account', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-800"
                          >
                            <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                            <option value="Raw Materials">Raw Materials</option>
                            <option value="Printing Substrates">Printing Substrates</option>
                            <option value="Solvent & Eco Inks">Solvent &amp; Eco Inks</option>
                          </select>
                        </td>

                        {/* Quantity */}
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-right font-mono font-semibold"
                          />
                        </td>

                        {/* Rate */}
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                            className="w-24 px-2 py-1.5 border border-slate-300 rounded-lg text-right font-mono font-semibold"
                          />
                        </td>

                        {/* Discount */}
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', Number(e.target.value))}
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-right font-mono"
                          />
                        </td>

                        {/* Tax Rate */}
                        <td className="p-2 text-right">
                          <select
                            value={item.taxRate}
                            onChange={(e) => updateItem(item.id, 'taxRate', Number(e.target.value))}
                            className="w-20 px-1 py-1.5 border border-slate-300 rounded-lg text-right font-mono"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>

                        {/* Amount */}
                        <td className="p-2 text-right font-mono font-bold text-slate-900 pt-3">
                          {formatCurrency(item.totalAmount)}
                        </td>

                        {/* Delete */}
                        <td className="p-2 text-center pt-2.5">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Row button */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-brand-600 text-xs shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Row</span>
                </button>
              </div>
            </div>
          </div>

          {/* Totals Section matching Screenshot 2 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-200">
            {/* Notes & Terms */}
            <div className="md:col-span-6 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Will be displayed on purchase order"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terms &amp; Conditions</label>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="md:col-span-6 space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center py-1">
                <span className="font-semibold text-slate-600">Sub Total</span>
                <span className="font-mono font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">Discount (%)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-right border border-slate-300 rounded font-mono"
                  />
                  <span className="font-mono text-rose-600">- {formatCurrency(discountAmount)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">Tax Total (GST)</span>
                <span className="font-mono font-semibold text-slate-800">{formatCurrency(taxTotal)}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600">Adjustment</span>
                <input
                  type="number"
                  step="0.01"
                  value={adjustment}
                  onChange={(e) => setAdjustment(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total (INR)</span>
                <span className="font-mono text-base text-brand-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons matching Screenshot 2 */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSavePO('DRAFT')}
                disabled={saving}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSavePO('ISSUED')}
                disabled={saving}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save and Send</span>
              </button>
              <Link
                href="/purchases/orders"
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-semibold"
              >
                Cancel
              </Link>
            </div>

            <div className="text-xs text-slate-500">
              PDF Template: <span className="font-semibold text-slate-800">Standard Template</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
