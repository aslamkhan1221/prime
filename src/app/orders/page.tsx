'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { formatCurrency, formatDate, UNIT_OPTIONS, PRICING_TYPES } from '@/lib/utils';
import { calculateLineItem, calculateDocumentTotals } from '@/lib/calculations';
import {
  ShoppingBag,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  UserCheck,
  FileText,
  X,
  Layers,
} from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [partnerFilter, setPartnerFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [assignedPartnerId, setAssignedPartnerId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [notes, setNotes] = useState('');
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

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchOrders = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const url = `/api/orders?search=${encodeURIComponent(search)}&status=${statusFilter}&partnerId=${partnerFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      if (!isSilent) error('Failed to load orders');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const loadDependencies = async () => {
    try {
      const [custRes, itemRes, partRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/items?status=ACTIVE'),
        fetch('/api/partners'),
      ]);
      const custData = await custRes.json();
      const itemData = await itemRes.json();
      const partData = await partRes.json();
      setCustomers(custData.customers || []);
      setCatalogItems(itemData.items || []);
      setPartners(partData.rawPartners || partData.partners || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
    loadDependencies();
  }, [statusFilter, partnerFilter]);

  const openAddModal = () => {
    setEditingOrder(null);
    setCustomerId(customers[0]?.id || '');
    setAssignedPartnerId('');
    setOrderNumber('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDate('');
    setStatus('PENDING');
    setNotes('');
    setItems([
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
    setModalOpen(true);
  };

  const openEditModal = (order: any) => {
    setEditingOrder(order);
    setCustomerId(order.customerId);
    setAssignedPartnerId(order.assignedPartnerId || '');
    setOrderNumber(order.orderNumber);
    setOrderDate(new Date(order.orderDate).toISOString().split('T')[0]);
    setExpectedDate(order.expectedDate ? new Date(order.expectedDate).toISOString().split('T')[0] : '');
    setStatus(order.status);
    setNotes(order.notes || '');
    setItems(
      order.items.map((it: any) => ({
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
    setModalOpen(true);
  };

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

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      error('Please select a client');
      return;
    }
    if (items.some((it) => !it.name.trim())) {
      error('Please provide item names for all order rows');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId,
        assignedPartnerId: assignedPartnerId || null,
        orderNumber: orderNumber || undefined,
        orderDate,
        expectedDate: expectedDate || null,
        status,
        notes,
        items,
      };

      if (editingOrder) {
        const res = await fetch(`/api/orders/${editingOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update order');

        // INSTANT DISPLAY: Update order in list immediately
        const updated = data.order || { ...editingOrder, ...payload };
        setOrders((prev) => prev.map((ord) => (ord.id === editingOrder.id ? { ...ord, ...updated } : ord)));
        setModalOpen(false);
        success('Order updated successfully');
        fetchOrders(true); // Silent background sync
      } else {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create order');

        // INSTANT DISPLAY: Prepend new order immediately
        if (data.order) {
          setOrders((prev) => [data.order, ...prev]);
        }
        setModalOpen(false);
        success('Order created successfully');
        fetchOrders(true); // Silent background sync
      }
    } catch (err: any) {
      error(err.message || 'Error saving order');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/convert`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert');
      success(`Converted to Invoice #${data.invoice?.invoiceNumber}`);
      router.push(`/invoices/${data.invoice?.id}`);
    } catch (err: any) {
      error(err.message || 'Error converting order');
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    const targetId = orderToDelete.id;
    // INSTANT DISPLAY: Remove immediately
    setOrders((prev) => prev.filter((ord) => ord.id !== targetId));
    setDeleteConfirmOpen(false);
    success('Order deleted successfully');

    try {
      const res = await fetch(`/api/orders/${targetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete order');
      fetchOrders(true); // Silent background sync
    } catch (err: any) {
      error(err.message || 'Error deleting order');
      fetchOrders(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Orders & Production Jobs"
          subtitle="Manage design orders, measurements, partner visibility assignment, and 1-click invoice conversion"
          actionText="Create New Order"
          onActionClick={openAddModal}
          actionIcon={<Plus className="w-4 h-4" />}
        />

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order #, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition font-medium"
              />
            </div>

            {/* Partner Visibility Filter for SuperAdmin */}
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="ALL">All Partners & Studio</option>
              <option value="UNASSIGNED">Studio Only (Unassigned)</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  Partner: {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
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

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Assigned Partner</th>
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4 text-right">Items & Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <div>Loading orders...</div>
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00a3e0] text-sm">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link href={`/customers/${ord.customer?.id}`} className="font-bold text-slate-900 hover:text-[#00a3e0]">
                          {ord.customer?.name}
                        </Link>
                        {ord.customer?.companyName && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{ord.customer.companyName}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {ord.assignedPartner ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            <UserCheck className="w-2.5 h-2.5" />
                            {ord.assignedPartner.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">General / Studio</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{formatDate(ord.orderDate)}</div>
                        {ord.expectedDate && (
                          <div className="text-[10px] text-slate-500">Due: {formatDate(ord.expectedDate)}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(ord.grandTotal)}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{ord.items?.length || 0} line item(s)</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ord.status === 'IN_PROGRESS'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : ord.status === 'CONFIRMED'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : ord.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ord.convertedToInvoiceId ? (
                            <Link
                              href={`/invoices/${ord.convertedToInvoiceId}`}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Invoice</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleConvertOrder(ord.id)}
                              title="Convert Order to Tax Invoice"
                              className="px-2.5 py-1 bg-gradient-to-r from-[#00a3e0] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm shadow-sky-500/20"
                            >
                              <span>Convert</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(ord)}
                            title="Edit Order"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setOrderToDelete(ord);
                              setDeleteConfirmOpen(true);
                            }}
                            title="Delete Order"
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
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No orders found. Click &quot;Create New Order&quot; to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Order Modal with live Dimensional Pricing engine */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-6 rounded-full bg-gradient-to-b from-[#00a3e0] via-[#ec008c] to-[#ffd100]" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingOrder ? `Edit Order #${orderNumber}` : 'Create New Graphic Design Order'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure client job specifications, measurements, and partner visibility</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveOrder} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* Client, Partner Visibility & Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer / Client <span className="text-[#ec008c]">*</span>
                    </label>
                    <select
                      required
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                    >
                      <option value="">Select a customer...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assign to Partner (Portal Visibility)
                    </label>
                    <select
                      value={assignedPartnerId}
                      onChange={(e) => setAssignedPartnerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-brand-500 font-medium"
                    >
                      <option value="">-- General / Visible to Studio --</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Order Date
                    </label>
                    <input
                      type="date"
                      required
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 font-medium"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Items & Measurement Lines */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Order Items & Dimensions
                    </h4>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="text-xs font-bold text-[#00a3e0] hover:text-[#0284c7] flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Line Item</span>
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
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                            {/* Fast Item Picker */}
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                                Load from Catalog or Custom
                              </label>
                              <select
                                value={row.itemId}
                                onChange={(e) => handleItemSelect(idx, e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 mb-1.5 focus:border-brand-500 font-medium"
                              >
                                <option value="">-- Custom / Select Item --</option>
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
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:border-brand-500"
                              />
                            </div>

                            {/* Pricing Calculation Mode */}
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                                Pricing Logic
                              </label>
                              <select
                                value={row.pricingType}
                                onChange={(e) => updateItemField(idx, 'pricingType', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 mb-1.5 focus:border-brand-500 font-medium"
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
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:border-brand-500 font-medium"
                              >
                                {UNIT_OPTIONS.map((u) => (
                                  <option key={u.value} value={u.value}>
                                    {u.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Dimensions or Quantity */}
                            <div className="sm:col-span-5 grid grid-cols-3 gap-2">
                              {row.pricingType === 'DIMENSION_RATE' ? (
                                <>
                                  <div>
                                    <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                                      Width ({row.unit?.replace('_', ' ')})
                                    </label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      placeholder="W"
                                      value={row.width || ''}
                                      onChange={(e) => updateItemField(idx, 'width', e.target.value)}
                                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono text-center font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                                      Height ({row.unit?.replace('_', ' ')})
                                    </label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      placeholder="H"
                                      value={row.height || ''}
                                      onChange={(e) => updateItemField(idx, 'height', e.target.value)}
                                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono text-center font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                                      Qty (Pcs)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={row.quantity || 1}
                                      onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono text-center font-medium"
                                    />
                                  </div>
                                </>
                              ) : row.pricingType === 'AREA_RATE' ? (
                                <>
                                  <div className="col-span-2">
                                    <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                                      Total Area ({row.unit?.replace('_', ' ')})
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Area"
                                      value={row.area || ''}
                                      onChange={(e) => updateItemField(idx, 'area', e.target.value)}
                                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                                      Qty
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={row.quantity || 1}
                                      onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono text-center font-medium"
                                    />
                                  </div>
                                </>
                              ) : (
                                <div className="col-span-3">
                                  <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                                    Quantity ({row.unit?.replace('_', ' ')})
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    value={row.quantity || 1}
                                    onChange={(e) => updateItemField(idx, 'quantity', e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono text-center font-medium"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Rate, Discount, Tax, and Computed Amount */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-200 items-center">
                            <div>
                              <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Rate (₹)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={row.rate || ''}
                                onChange={(e) => updateItemField(idx, 'rate', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Disc %</label>
                              <input
                                type="number"
                                step="0.5"
                                value={row.discount || ''}
                                onChange={(e) => updateItemField(idx, 'discount', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">GST %</label>
                              <input
                                type="number"
                                step="0.1"
                                value={row.taxRate ?? 18}
                                onChange={(e) => updateItemField(idx, 'taxRate', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono font-medium"
                              />
                            </div>

                            <div className="col-span-2 sm:col-span-2 flex items-center justify-between pl-2">
                              <div>
                                <div className="text-[10px] text-slate-500">
                                  {row.pricingType === 'DIMENSION_RATE'
                                    ? `Computed Area: ${lineCalc.effectiveQuantity} sq units`
                                    : `Tax: ${formatCurrency(lineCalc.taxAmount)}`}
                                </div>
                                <div className="text-sm font-black text-[#00a3e0] font-mono">
                                  {formatCurrency(lineCalc.totalAmount)}
                                </div>
                              </div>

                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItemRow(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

                {/* Bottom Notes & Grand Totals Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Job / Production Notes
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Special design instructions, print finish, delivery date requirements..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (Taxable):</span>
                      <span className="font-mono text-slate-900 font-semibold">{formatCurrency(computedTotals.subtotal)}</span>
                    </div>
                    {computedTotals.discountTotal > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Total Discount:</span>
                        <span className="font-mono">-{formatCurrency(computedTotals.discountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>GST / Tax:</span>
                      <span className="font-mono text-slate-900 font-semibold">{formatCurrency(computedTotals.taxTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-[#00a3e0] pt-2 border-t border-slate-200">
                      <span className="text-slate-900">Grand Total:</span>
                      <span className="font-mono">{formatCurrency(computedTotals.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#00a3e0] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteOrder}
          isLoading={deleting}
          title="Delete Order"
          message={`Are you sure you want to delete order #${orderToDelete?.orderNumber}? This will remove associated production lines.`}
          confirmText="Delete Order"
        />
      </div>
    </DashboardLayout>
  );
}
