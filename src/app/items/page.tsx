'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { formatCurrency } from '@/lib/utils';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Info,
  HelpCircle,
  Check,
  ShoppingBag,
  Layers,
} from 'lucide-react';

const STANDARD_UNITS = [
  { value: 'pcs', label: 'pcs (Pieces)' },
  { value: 'Sq ft', label: 'Sq ft (Square Feet)' },
  { value: 'sq m', label: 'sq m (Square Meter)' },
  { value: 'box', label: 'box (Box)' },
  { value: 'roll', label: 'roll (Roll)' },
  { value: 'cm', label: 'cm (Centimeter)' },
  { value: 'mm', label: 'mm (Millimeter)' },
  { value: 'inch', label: 'inch (Inch)' },
  { value: 'ft', label: 'ft (Foot)' },
  { value: 'm', label: 'm (Meter)' },
  { value: 'kg', label: 'kg (Kilogram)' },
  { value: 'hour', label: 'hour (Hour)' },
  { value: 'day', label: 'day (Day)' },
];

const SALES_ACCOUNTS = [
  'Sales',
  'General Income',
  'Design Revenue',
  'Printing Revenue',
  'Advertising Sales',
  'Other Charges',
];

const PURCHASE_ACCOUNTS = [
  'Cost of Goods Sold',
  'Raw Materials',
  'Printing Media & Vinyls',
  'Ink & Consumables',
  'Hardware & Equipment',
  'Job Work Charges',
  'Operating Expenses',
];

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Custom Unit Entry Mode
  const [customUnitMode, setCustomUnitMode] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');

  // Form State matching screenshot
  const [formData, setFormData] = useState({
    name: '',
    itemType: 'GOODS', // 'GOODS' | 'SERVICE'
    unit: 'pcs',
    customUnit: '',
    // Sales Information
    enableSales: true,
    price: 0,
    salesAccount: 'Sales',
    description: '',
    // Purchase Information
    enablePurchase: true,
    costPrice: 0,
    purchaseAccount: 'Cost of Goods Sold',
    purchaseDescription: '',
    preferredVendor: '',
    // Auxiliary
    category: 'General',
    taxRate: 18,
    isActive: true,
  });

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const url = `/api/items?search=${encodeURIComponent(search)}${
        typeFilter !== 'ALL' ? `&itemType=${typeFilter}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      error('Failed to load items catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setCustomUnitMode(false);
    setCustomUnitInput('');
    setFormData({
      name: '',
      itemType: 'GOODS',
      unit: 'pcs',
      customUnit: '',
      enableSales: true,
      price: 0,
      salesAccount: 'Sales',
      description: '',
      enablePurchase: true,
      costPrice: 0,
      purchaseAccount: 'Cost of Goods Sold',
      purchaseDescription: '',
      preferredVendor: '',
      category: 'General',
      taxRate: 18,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    const isCustom = !STANDARD_UNITS.some((u) => u.value.toLowerCase() === (item.unit || '').toLowerCase());
    setCustomUnitMode(isCustom && Boolean(item.unit && item.unit !== 'pcs'));
    setCustomUnitInput(isCustom ? item.unit || '' : '');

    setFormData({
      name: item.name || '',
      itemType: (item.itemType || 'GOODS').toUpperCase() === 'SERVICE' ? 'SERVICE' : 'GOODS',
      unit: isCustom ? '__CUSTOM__' : item.unit || 'pcs',
      customUnit: item.customUnit || (isCustom ? item.unit : ''),
      enableSales: item.price !== undefined && item.price !== null,
      price: item.price || 0,
      salesAccount: item.salesAccount || 'Sales',
      description: item.description || '',
      enablePurchase: Boolean(item.costPrice !== undefined && item.costPrice !== null),
      costPrice: item.costPrice || 0,
      purchaseAccount: item.purchaseAccount || 'Cost of Goods Sold',
      purchaseDescription: item.purchaseDescription || item.description || '',
      preferredVendor: item.preferredVendor || '',
      category: item.category || 'General',
      taxRate: item.taxRate ?? 18,
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Item name is required');
      return;
    }

    let finalUnit = formData.unit;
    if (formData.unit === '__CUSTOM__' || customUnitMode) {
      finalUnit = customUnitInput.trim() || formData.customUnit?.trim() || 'pcs';
    }

    const payload = {
      name: formData.name.trim(),
      itemType: formData.itemType,
      unit: finalUnit,
      customUnit: finalUnit,
      price: formData.enableSales ? Number(formData.price) || 0 : 0,
      salesAccount: formData.salesAccount || 'Sales',
      description: formData.description?.trim() || '',
      costPrice: formData.enablePurchase ? Number(formData.costPrice) || 0 : 0,
      purchaseAccount: formData.purchaseAccount || 'Cost of Goods Sold',
      purchaseDescription: formData.purchaseDescription?.trim() || '',
      preferredVendor: formData.preferredVendor?.trim() || '',
      taxRate: Number(formData.taxRate) ?? 18,
      category: formData.itemType === 'SERVICE' ? 'Graphic Design' : 'Print Media',
      isActive: formData.isActive,
    };

    setSaving(true);
    try {
      if (editingItem) {
        const res = await fetch(`/api/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update item');
        success('Item updated successfully');
      } else {
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create item');
        success('Item created successfully');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err: any) {
      error(err.message || 'Error saving item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/items/${itemToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item');
      success('Item deleted successfully');
      setDeleteConfirmOpen(false);
      fetchItems();
    } catch (err: any) {
      error(err.message || 'Error deleting item');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Items & Services"
          subtitle="Manage goods, print media, substrates, and design services"
          actionText="New Item"
          onActionClick={openAddModal}
          actionIcon={<Plus className="w-4 h-4" />}
        />

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items by name, vendor, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Types</option>
              <option value="GOODS">Goods (Products)</option>
              <option value="SERVICE">Services</option>
            </select>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                      <div>Loading catalog items...</div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-400">No items found</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Click &quot;New Item&quot; to add your first product or service.
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5 whitespace-pre-line">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            (item.itemType || 'GOODS').toUpperCase() === 'SERVICE'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {(item.itemType || 'GOODS').toUpperCase() === 'SERVICE' ? 'Service' : 'Goods'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{item.unit || 'pcs'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(item.price || 0, '₹')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(item.costPrice || 0, '₹')}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        <div>{item.salesAccount || 'Sales'}</div>
                        {item.preferredVendor && (
                          <div className="text-[10px] text-slate-500">Vendor: {item.preferredVendor}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            item.isActive !== false ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New / Edit Item Modal matching user reference screenshot */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
                <h3 className="text-lg font-bold text-white">
                  {editingItem ? 'Edit Item' : 'New Item'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-6 space-y-6 max-h-[calc(88vh-80px)] overflow-y-auto">
                {/* Info Callout Banner matching user screenshot */}
                <div className="flex items-start gap-3 p-4 bg-sky-950/40 border border-sky-800/60 rounded-xl text-sky-200 text-xs leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="block text-sky-100 font-semibold mb-0.5">
                      Do you want to keep track of this item?
                    </strong>
                    <span className="text-sky-300/90 text-[11px]">
                      Enable Inventory to view its stock based on the sales and purchase transactions you record for it. Go to{' '}
                      <span className="italic font-medium text-white">Settings &gt; Preferences &gt; Items</span> and enable inventory.
                    </span>
                  </div>
                </div>

                {/* Primary Item Attributes: Name, Type, Unit */}
                <div className="space-y-4">
                  {/* Name* */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="sm:w-28 text-xs font-semibold text-rose-400">
                      Name*
                    </label>
                    <div className="flex-1 max-w-md">
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Flex Star with Frame, Vinyl Print, Logo Design"
                        className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                      />
                    </div>
                  </div>

                  {/* Type Radio: Goods vs Service */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="sm:w-28 flex items-center gap-1 text-xs font-semibold text-slate-300">
                      <span>Type</span>
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="itemType"
                          value="GOODS"
                          checked={formData.itemType === 'GOODS'}
                          onChange={() => setFormData({ ...formData, itemType: 'GOODS' })}
                          className="w-4 h-4 text-brand-500 bg-slate-950 border-slate-700 focus:ring-brand-500"
                        />
                        <span>Goods</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="itemType"
                          value="SERVICE"
                          checked={formData.itemType === 'SERVICE'}
                          onChange={() => setFormData({ ...formData, itemType: 'SERVICE' })}
                          className="w-4 h-4 text-brand-500 bg-slate-950 border-slate-700 focus:ring-brand-500"
                        />
                        <span>Service</span>
                      </label>
                    </div>
                  </div>

                  {/* Unit Dropdown / Type to add */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="sm:w-28 flex items-center gap-1 text-xs font-semibold text-slate-300">
                      <span>Unit</span>
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex-1 max-w-md">
                      {customUnitMode ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customUnitInput}
                            onChange={(e) => setCustomUnitInput(e.target.value)}
                            placeholder="Type custom unit (e.g. Bundle, Set, Sheet)..."
                            className="flex-1 px-3.5 py-2 bg-slate-950/70 border border-brand-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customUnitInput.trim()) {
                                setFormData({ ...formData, unit: customUnitInput.trim() });
                              }
                              setCustomUnitMode(false);
                            }}
                            className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <select
                          value={formData.unit}
                          onChange={(e) => {
                            if (e.target.value === '__CUSTOM__') {
                              setCustomUnitMode(true);
                              setCustomUnitInput('');
                            } else {
                              setFormData({ ...formData, unit: e.target.value });
                            }
                          }}
                          className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                        >
                          <option value="" disabled>
                            Select or type to add
                          </option>
                          {STANDARD_UNITS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                          <option value="__CUSTOM__" className="text-brand-400 font-bold">
                            + Type custom unit...
                          </option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sales Information Section */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableSales}
                      onChange={(e) => setFormData({ ...formData, enableSales: e.target.checked })}
                      className="w-4 h-4 text-brand-500 bg-slate-950 border-slate-700 rounded focus:ring-brand-500"
                    />
                    <span>Sales Information</span>
                  </label>

                  {formData.enableSales && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pl-6">
                      {/* Left: Selling Price & Description */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-rose-400 mb-1">
                            Selling Price*
                          </label>
                          <div className="relative flex rounded-xl border border-slate-700 bg-slate-950/70 overflow-hidden focus-within:border-brand-500">
                            <span className="inline-flex items-center px-3 text-xs font-bold text-slate-400 bg-slate-800/80 border-r border-slate-700 select-none">
                              INR
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required={formData.enableSales}
                              value={formData.price === 0 ? '' : formData.price}
                              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="w-full px-3 py-2 bg-transparent text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Specification details, printing type, media type..."
                            className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                          />
                        </div>
                      </div>

                      {/* Right: Account* */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-rose-400 mb-1">
                            Account*
                          </label>
                          <select
                            value={formData.salesAccount}
                            onChange={(e) => setFormData({ ...formData, salesAccount: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                          >
                            {SALES_ACCOUNTS.map((acc) => (
                              <option key={acc} value={acc}>
                                {acc}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Purchase Information Section */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enablePurchase}
                      onChange={(e) => setFormData({ ...formData, enablePurchase: e.target.checked })}
                      className="w-4 h-4 text-brand-500 bg-slate-950 border-slate-700 rounded focus:ring-brand-500"
                    />
                    <span>Purchase Information</span>
                  </label>

                  {formData.enablePurchase && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pl-6">
                      {/* Left: Cost Price & Description */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-rose-400 mb-1">
                            Cost Price*
                          </label>
                          <div className="relative flex rounded-xl border border-slate-700 bg-slate-950/70 overflow-hidden focus-within:border-brand-500">
                            <span className="inline-flex items-center px-3 text-xs font-bold text-slate-400 bg-slate-800/80 border-r border-slate-700 select-none">
                              INR
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required={formData.enablePurchase}
                              value={formData.costPrice === 0 ? '' : formData.costPrice}
                              onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="w-full px-3 py-2 bg-transparent text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={formData.purchaseDescription}
                            onChange={(e) => setFormData({ ...formData, purchaseDescription: e.target.value })}
                            placeholder="Vendor purchase specifications, raw material details..."
                            className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                          />
                        </div>
                      </div>

                      {/* Right: Account* & Preferred Vendor */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-rose-400 mb-1">
                            Account*
                          </label>
                          <select
                            value={formData.purchaseAccount}
                            onChange={(e) => setFormData({ ...formData, purchaseAccount: e.target.value })}
                            className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                          >
                            {PURCHASE_ACCOUNTS.map((acc) => (
                              <option key={acc} value={acc}>
                                {acc}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Preferred Vendor
                          </label>
                          <input
                            type="text"
                            value={formData.preferredVendor}
                            onChange={(e) => setFormData({ ...formData, preferredVendor: e.target.value })}
                            placeholder="Select or type vendor"
                            className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
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
          onConfirm={handleDeleteItem}
          isLoading={deleting}
          title="Delete Catalog Item"
          message={`Are you sure you want to delete "${itemToDelete?.name}"? If this item is used in existing invoices, you can mark it Inactive instead.`}
          confirmText="Delete Item"
        />
      </div>
    </DashboardLayout>
  );
}
