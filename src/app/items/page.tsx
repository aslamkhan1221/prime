'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { formatCurrency, UNIT_OPTIONS, ITEM_CATEGORIES } from '@/lib/utils';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  List,
} from 'lucide-react';

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Dynamic Categories and Types
  const [categories, setCategories] = useState<string[]>(ITEM_CATEGORIES);
  const [itemTypes, setItemTypes] = useState<string[]>(['SERVICE', 'PRODUCT']);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Custom Category & Type Modes in Form
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const [customTypeMode, setCustomTypeMode] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: 'Branding & Logo Design',
    itemType: 'SERVICE',
    price: 0,
    costPrice: 0,
    taxRate: 18,
    unit: 'PIECE',
    customUnit: '',
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
      const url = `/api/items?search=${encodeURIComponent(search)}&category=${categoryFilter}&itemType=${typeFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      const fetchedItems = data.items || [];
      setItems(fetchedItems);

      // Dynamically extract categories & item types from existing items
      const dbCategories = Array.from(
        new Set(fetchedItems.map((it: any) => it.category).filter(Boolean))
      ) as string[];
      setCategories((prev) => Array.from(new Set([...prev, ...dbCategories])));

      const dbTypes = Array.from(
        new Set(fetchedItems.map((it: any) => it.itemType).filter(Boolean))
      ) as string[];
      setItemTypes((prev) => Array.from(new Set([...prev, ...dbTypes])));
    } catch {
      error('Failed to load catalog items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [categoryFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setCustomCategoryMode(false);
    setCustomCategoryInput('');
    setCustomTypeMode(false);
    setCustomTypeInput('');
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: categories[0] || 'Branding & Logo Design',
      itemType: itemTypes[0] || 'SERVICE',
      price: 0,
      costPrice: 0,
      taxRate: 18,
      unit: 'PIECE',
      customUnit: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setCustomCategoryMode(false);
    setCustomCategoryInput('');
    setCustomTypeMode(false);
    setCustomTypeInput('');

    if (item.category && !categories.includes(item.category)) {
      setCategories((prev) => [...prev, item.category]);
    }
    if (item.itemType && !itemTypes.includes(item.itemType)) {
      setItemTypes((prev) => [...prev, item.itemType]);
    }

    setFormData({
      name: item.name || '',
      sku: item.sku || '',
      description: item.description || '',
      category: item.category || categories[0] || 'Branding & Logo Design',
      itemType: item.itemType || itemTypes[0] || 'SERVICE',
      price: item.price || 0,
      costPrice: item.costPrice || 0,
      taxRate: item.taxRate ?? 18,
      unit: item.unit || 'PIECE',
      customUnit: item.customUnit || '',
      isActive: item.isActive !== undefined ? item.isActive : true,
    });
    setModalOpen(true);
  };

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
    setFormData((prev) => ({ ...prev, category: trimmed }));
    setCustomCategoryMode(false);
    setCustomCategoryInput('');
    success(`Category "${trimmed}" added to dropdown list`);
  };

  const handleAddCustomType = () => {
    const trimmed = customTypeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!itemTypes.includes(trimmed)) {
      setItemTypes((prev) => [...prev, trimmed]);
    }
    setFormData((prev) => ({ ...prev, itemType: trimmed }));
    setCustomTypeMode(false);
    setCustomTypeInput('');
    success(`Item Type "${trimmed}" added to dropdown list`);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Item name is required');
      return;
    }

    // Auto-apply custom category/type if user typed in input but didn't click add button
    let finalCategory = formData.category;
    if (customCategoryMode && customCategoryInput.trim()) {
      finalCategory = customCategoryInput.trim();
      if (!categories.includes(finalCategory)) {
        setCategories((prev) => [...prev, finalCategory]);
      }
    }

    let finalItemType = formData.itemType;
    if (customTypeMode && customTypeInput.trim()) {
      finalItemType = customTypeInput.trim().toUpperCase();
      if (!itemTypes.includes(finalItemType)) {
        setItemTypes((prev) => [...prev, finalItemType]);
      }
    }

    const payload = {
      ...formData,
      category: finalCategory,
      itemType: finalItemType,
      costPrice: formData.price, // ensure valid numeric value
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
          title="Items, Products & Graphic Services"
          subtitle="Manage design services, banner printing, vinyl signage, and measurement units"
          actionText="Add New Item / Service"
          onActionClick={openAddModal}
          actionIcon={<Plus className="w-4 h-4" />}
        />

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items, SKU, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Types</option>
              {itemTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items Grid / Table */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Item Name / Code</th>
                  <th className="py-3.5 px-4">Category & Type</th>
                  <th className="py-3.5 px-4">Billing Unit</th>
                  <th className="py-3.5 px-4 text-right">Rate</th>
                  <th className="py-3.5 px-4 text-center">GST %</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Loading catalog items...
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-800/30 transition group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{it.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          {it.sku && <span className="font-mono text-brand-400 font-semibold">{it.sku}</span>}
                          {it.description && <span className="truncate max-w-xs">{it.description}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium">{it.category}</div>
                        <span
                          className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                            it.itemType === 'SERVICE'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : it.itemType === 'PRODUCT'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {it.itemType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {it.unit === 'CUSTOM' ? it.customUnit || 'Custom' : it.unit?.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                        {formatCurrency(it.price)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                        {it.taxRate}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            it.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {it.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(it)}
                            title="Edit Item"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete(it);
                              setDeleteConfirmOpen(true);
                            }}
                            title="Delete Item"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
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
                      No items found. Click &quot;Add New Item / Service&quot; to populate your catalog.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Item Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingItem ? 'Edit Item / Service' : 'Add New Item / Service'}
                    </h3>
                    <p className="text-xs text-slate-400">Configure rate, measurement units, categories, and item types</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Item Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Item / Service Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Flex Banner Print, Logo Design"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* SKU / Item Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      SKU / Item Code
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      placeholder="e.g. BAN-FLEX-01"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Category Selection with Custom Add / Manual Entry */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Category
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCategoryMode(!customCategoryMode);
                          if (!customCategoryMode) setCustomCategoryInput('');
                        }}
                        className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                      >
                        {customCategoryMode ? (
                          <>
                            <List className="w-3 h-3" /> Select from List
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3" /> + Custom / Manual
                          </>
                        )}
                      </button>
                    </div>

                    {customCategoryMode ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomCategory();
                            }
                          }}
                          placeholder="Enter custom category name..."
                          className="flex-1 px-3 py-2 bg-slate-800 border border-brand-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__ADD_CUSTOM__') {
                            setCustomCategoryMode(true);
                            setCustomCategoryInput('');
                          } else {
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__ADD_CUSTOM__" className="text-brand-400 font-bold">
                          + Add Custom Category / Enter Manually...
                        </option>
                      </select>
                    )}
                  </div>

                  {/* Item Type Selection with Custom Add / Manual Entry */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-300">
                        Item Type
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTypeMode(!customTypeMode);
                          if (!customTypeMode) setCustomTypeInput('');
                        }}
                        className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                      >
                        {customTypeMode ? (
                          <>
                            <List className="w-3 h-3" /> Select from List
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3" /> + Custom / Manual
                          </>
                        )}
                      </button>
                    </div>

                    {customTypeMode ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customTypeInput}
                          onChange={(e) => setCustomTypeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomType();
                            }
                          }}
                          placeholder="Enter custom item type (e.g. RETAINER, MEDIA)..."
                          className="flex-1 px-3 py-2 bg-slate-800 border border-brand-500/50 rounded-xl text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:border-brand-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomType}
                          className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shrink-0"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select
                        value={formData.itemType}
                        onChange={(e) => {
                          if (e.target.value === '__ADD_CUSTOM__') {
                            setCustomTypeMode(true);
                            setCustomTypeInput('');
                          } else {
                            setFormData({ ...formData, itemType: e.target.value });
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      >
                        {itemTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                        <option value="__ADD_CUSTOM__" className="text-brand-400 font-bold">
                          + Add Custom Type / Enter Manually...
                        </option>
                      </select>
                    )}
                  </div>

                  {/* Single Rate Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Rate (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  {/* Default Measurement Unit */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Default Measurement Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.unit === 'CUSTOM' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Custom Unit Name
                      </label>
                      <input
                        type="text"
                        value={formData.customUnit}
                        onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                        placeholder="e.g. Bundle, Roll, Box"
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Default GST / Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                        placeholder="18"
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Description & Specifications
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Specification details e.g., 340 GSM Star Flex with eyelets..."
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-800 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Active in catalog (available for new orders & invoices)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-600/30 transition"
                  >
                    {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Save to Catalog'}
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
          message={`Are you sure you want to delete item "${itemToDelete?.name}"? If this item is used in existing invoices, you should mark it Inactive instead.`}
          confirmText="Delete Item"
        />
      </div>
    </DashboardLayout>
  );
}
