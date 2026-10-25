'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building,
  FileText,
  ShoppingBag,
  X,
  Sparkles,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State matching Zoho Books screenshot
  const [activeTab, setActiveTab] = useState<'other' | 'address' | 'contact_persons' | 'custom_fields' | 'remarks'>('other');
  const [gstPrefillOpen, setGstPrefillOpen] = useState(false);
  const [prefillGstin, setPrefillGstin] = useState('');

  const [formData, setFormData] = useState({
    customerType: 'BUSINESS', // 'BUSINESS' | 'INDIVIDUAL'
    salutation: 'Mr.',
    firstName: '',
    lastName: '',
    companyName: '',
    name: '', // Display Name*
    email: '',
    workPhone: '',
    mobile: '',
    language: 'English',
    // Tab: Other Details
    pan: '',
    currency: 'INR - Indian Rupee',
    accountReceivable: 'Accounts Receivable',
    openingBalance: 0,
    paymentTerms: 'Due on Receipt',
    enablePortal: false,
    // Tab: Address
    billingAttention: '',
    billingCountry: 'India',
    billingStreet1: '',
    billingStreet2: '',
    billingCity: '',
    billingState: '',
    billingPincode: '',
    billingPhone: '',
    shippingAttention: '',
    shippingCountry: 'India',
    shippingStreet1: '',
    shippingStreet2: '',
    shippingCity: '',
    shippingState: '',
    shippingPincode: '',
    shippingPhone: '',
    billingAddress: '',
    shippingAddress: '',
    // Tab: Remarks
    notes: '',
    gstin: '',
    status: 'ACTIVE',
  });

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchCustomers = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const url = `/api/customers?search=${encodeURIComponent(search)}&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err: any) {
      if (!isSilent) error('Failed to load customers');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setActiveTab('other');
    setFormData({
      customerType: 'BUSINESS',
      salutation: 'Mr.',
      firstName: '',
      lastName: '',
      companyName: '',
      name: '',
      email: '',
      workPhone: '',
      mobile: '',
      language: 'English',
      pan: '',
      currency: 'INR - Indian Rupee',
      accountReceivable: 'Accounts Receivable',
      openingBalance: 0,
      paymentTerms: 'Due on Receipt',
      enablePortal: false,
      billingAttention: '',
      billingCountry: 'India',
      billingStreet1: '',
      billingStreet2: '',
      billingCity: '',
      billingState: '',
      billingPincode: '',
      billingPhone: '',
      shippingAttention: '',
      shippingCountry: 'India',
      shippingStreet1: '',
      shippingStreet2: '',
      shippingCity: '',
      shippingState: '',
      shippingPincode: '',
      shippingPhone: '',
      billingAddress: '',
      shippingAddress: '',
      notes: '',
      gstin: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const openEditModal = (customer: any) => {
    setEditingCustomer(customer);
    setActiveTab('other');
    setFormData({
      customerType: customer.customerType || 'BUSINESS',
      salutation: customer.salutation || 'Mr.',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      companyName: customer.companyName || '',
      name: customer.name || '',
      email: customer.email || '',
      workPhone: customer.workPhone || '',
      mobile: customer.mobile || '',
      language: customer.language || 'English',
      pan: customer.pan || '',
      currency: customer.currency || 'INR - Indian Rupee',
      accountReceivable: 'Accounts Receivable',
      openingBalance: customer.openingBalance || 0,
      paymentTerms: customer.paymentTerms || 'Due on Receipt',
      enablePortal: Boolean(customer.enablePortal),
      billingAttention: customer.name || '',
      billingCountry: 'India',
      billingStreet1: customer.billingAddress || '',
      billingStreet2: '',
      billingCity: '',
      billingState: '',
      billingPincode: '',
      billingPhone: customer.mobile || '',
      shippingAttention: customer.name || '',
      shippingCountry: 'India',
      shippingStreet1: customer.shippingAddress || customer.billingAddress || '',
      shippingStreet2: '',
      shippingCity: '',
      shippingState: '',
      shippingPincode: '',
      shippingPhone: customer.mobile || '',
      billingAddress: customer.billingAddress || '',
      shippingAddress: customer.shippingAddress || '',
      notes: customer.notes || '',
      gstin: customer.gstin || '',
      status: customer.status || 'ACTIVE',
    });
    setModalOpen(true);
  };

  // Auto-generate or suggest Display Name
  const handleAutoSuggestDisplayName = (type: string, val: string) => {
    const updated = { ...formData, [type]: val };
    let displayName = updated.name;
    if (!displayName || displayName === formData.companyName || displayName === `${formData.firstName} ${formData.lastName}`.trim()) {
      if (updated.customerType === 'BUSINESS' && updated.companyName.trim()) {
        displayName = updated.companyName.trim();
      } else {
        const contactName = `${updated.firstName} ${updated.lastName}`.trim();
        if (contactName) displayName = contactName;
      }
    }
    setFormData({ ...updated, name: displayName });
  };

  // Prefill details from GSTIN
  const handleApplyGstPrefill = () => {
    const cleanGst = prefillGstin.trim().toUpperCase();
    if (!cleanGst || cleanGst.length < 15) {
      error('Please enter a valid 15-digit GSTIN number');
      return;
    }

    const stateCode = cleanGst.slice(0, 2);
    const panFromGst = cleanGst.slice(2, 12);
    const stateMap: { [key: string]: string } = {
      '01': 'Jammu & Kashmir',
      '02': 'Himachal Pradesh',
      '03': 'Punjab',
      '04': 'Chandigarh',
      '05': 'Uttarakhand',
      '06': 'Haryana',
      '07': 'Delhi',
      '08': 'Rajasthan',
      '09': 'Uttar Pradesh',
      '10': 'Bihar',
      '19': 'West Bengal',
      '24': 'Gujarat',
      '27': 'Maharashtra',
      '29': 'Karnataka',
      '32': 'Kerala',
      '33': 'Tamil Nadu',
      '36': 'Telangana',
      '37': 'Andhra Pradesh',
    };

    const detectedState = stateMap[stateCode] || '';
    setFormData((prev) => ({
      ...prev,
      gstin: cleanGst,
      pan: panFromGst,
      billingState: detectedState,
      shippingState: detectedState,
    }));

    setGstPrefillOpen(false);
    success(`GSTIN parsed! State (${detectedState}) and PAN (${panFromGst}) auto-filled.`);
  };

  // Copy billing address to shipping address
  const handleCopyBillingAddress = () => {
    setFormData((prev) => ({
      ...prev,
      shippingAttention: prev.billingAttention,
      shippingCountry: prev.billingCountry,
      shippingStreet1: prev.billingStreet1,
      shippingStreet2: prev.billingStreet2,
      shippingCity: prev.billingCity,
      shippingState: prev.billingState,
      shippingPincode: prev.billingPincode,
      shippingPhone: prev.billingPhone,
    }));
    success('Billing address copied to shipping address');
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = formData.name.trim() || formData.companyName.trim() || `${formData.firstName} ${formData.lastName}`.trim();
    if (!finalName) {
      error('Display Name is required');
      return;
    }

    // Build serialized addresses
    const bParts = [
      formData.billingAttention,
      formData.billingStreet1,
      formData.billingStreet2,
      formData.billingCity,
      formData.billingState,
      formData.billingPincode,
    ].filter(Boolean);
    const formattedBilling = bParts.join(', ');

    const sParts = [
      formData.shippingAttention,
      formData.shippingStreet1,
      formData.shippingStreet2,
      formData.shippingCity,
      formData.shippingState,
      formData.shippingPincode,
    ].filter(Boolean);
    const formattedShipping = sParts.join(', ') || formattedBilling;

    const payload = {
      name: finalName,
      customerType: formData.customerType,
      salutation: formData.salutation,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      companyName: formData.companyName.trim(),
      email: formData.email.trim(),
      workPhone: formData.workPhone.trim(),
      mobile: formData.mobile.trim(),
      language: formData.language,
      pan: formData.pan.trim().toUpperCase(),
      currency: formData.currency,
      openingBalance: Number(formData.openingBalance) || 0,
      paymentTerms: formData.paymentTerms,
      enablePortal: formData.enablePortal,
      billingAddress: formattedBilling || formData.billingAddress,
      shippingAddress: formattedShipping || formData.shippingAddress,
      notes: formData.notes.trim(),
      gstin: formData.gstin.trim().toUpperCase(),
      status: formData.status,
    };

    setSaving(true);
    try {
      if (editingCustomer) {
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update customer');

        // INSTANT DISPLAY: Immediately update customer in table state
        const updated = data.customer || { ...editingCustomer, ...payload };
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...updated } : c))
        );
        setModalOpen(false);
        success('Customer updated successfully');
        fetchCustomers(true); // Silent background sync
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create customer');

        // INSTANT DISPLAY: Immediately prepend new customer
        if (data.customer) {
          const newCust = {
            ...data.customer,
            totalOrders: 0,
            totalInvoices: 0,
            totalBilled: 0,
            totalPaid: 0,
            pendingAmount: 0,
          };
          setCustomers((prev) => [newCust, ...prev]);
        }
        setModalOpen(false);
        success('Customer created successfully');
        fetchCustomers(true); // Silent background sync
      }
    } catch (err: any) {
      error(err.message || 'Error saving customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    const targetId = customerToDelete.id;
    // INSTANT DISPLAY: Remove immediately from state
    setCustomers((prev) => prev.filter((c) => c.id !== targetId));
    setDeleteConfirmOpen(false);
    success('Customer deleted successfully');

    try {
      const res = await fetch(`/api/customers/${targetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete customer');
      fetchCustomers(true); // Silent background sync
    } catch (err: any) {
      error(err.message || 'Error deleting customer');
      fetchCustomers(false); // Reload on error
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Customer Relationship Management (CRM)"
          subtitle="Manage client portfolios, billing addresses, GST details, and outstanding balances"
          actionText="Add New Customer"
          onActionClick={openAddModal}
          actionIcon={<Plus className="w-4 h-4" />}
        />

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, company, email, GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
            />
          </form>

          <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
            {['ALL', 'ACTIVE', 'CLIENT', 'LEAD', 'INACTIVE'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Client / Company</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Tax / GSTIN</th>
                  <th className="py-3.5 px-4 text-right">Total Billed</th>
                  <th className="py-3.5 px-4 text-right">Pending Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Loading clients...
                    </td>
                  </tr>
                ) : customers.length > 0 ? (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition group">
                      <td className="py-3.5 px-4">
                        <Link href={`/customers/${c.id}`} className="font-bold text-slate-900 hover:text-brand-600 flex items-center gap-2">
                          <span>{c.name}</span>
                        </Link>
                        {c.companyName && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{c.companyName}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        {c.email && (
                          <div className="text-slate-600 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-brand-500" />
                            <span>{c.email}</span>
                          </div>
                        )}
                        {c.mobile && (
                          <div className="text-slate-500 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-brand-500" />
                            <span>{c.mobile}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.gstin ? (
                          <div className="font-mono text-[11px] text-slate-800 font-semibold">{c.gstin}</div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        {c.pan && <div className="font-mono text-[10px] text-slate-500 mt-0.5">PAN: {c.pan}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(c.totalBilled)}
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {c.totalInvoices} Invoices • {c.totalOrders} Orders
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={c.pendingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                          {formatCurrency(c.pendingAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'ACTIVE' || c.status === 'CLIENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : c.status === 'LEAD'
                              ? 'bg-brand-50 text-brand-700 border border-brand-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/customers/${c.id}`}
                            title="View Profile"
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(c)}
                            title="Edit Client"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCustomerToDelete(c);
                              setDeleteConfirmOpen(true);
                            }}
                            title="Delete Client"
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
                      No customers found. Click "Add New Customer" to add your first client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add / Edit Customer Modal */}
        {/* Add / Edit Customer Modal matching clean white studio aesthetic */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
              {/* Modal Top Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-6 rounded-full bg-gradient-to-b from-[#00a3e0] via-[#ec008c] to-[#ffd100]" />
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingCustomer ? 'Edit Customer' : 'New Customer'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveCustomer} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* GSTIN Prefill Banner (matches screenshot) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Prefill Customer details from the GST portal using the Customer's GSTIN.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGstPrefillOpen(true)}
                    className="text-sky-600 hover:text-sky-800 font-bold underline shrink-0 cursor-pointer"
                  >
                    Prefill &gt;
                  </button>
                </div>

                {/* Primary Contact & Core Fields */}
                <div className="space-y-4">
                  {/* Customer Type */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <div className="w-36 flex items-center gap-1.5 text-slate-700 font-semibold">
                      <span>Customer Type</span>
                      <span title="Select if customer is a registered business or an individual" className="cursor-help text-slate-400">ⓘ</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="radio"
                          name="customerType"
                          value="BUSINESS"
                          checked={formData.customerType === 'BUSINESS'}
                          onChange={() => setFormData({ ...formData, customerType: 'BUSINESS' })}
                          className="w-4 h-4 text-sky-600 bg-white border-slate-300 focus:ring-sky-500"
                        />
                        <span className="font-medium">Business</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                        <input
                          type="radio"
                          name="customerType"
                          value="INDIVIDUAL"
                          checked={formData.customerType === 'INDIVIDUAL'}
                          onChange={() => setFormData({ ...formData, customerType: 'INDIVIDUAL' })}
                          className="w-4 h-4 text-sky-600 bg-white border-slate-300 focus:ring-sky-500"
                        />
                        <span className="font-medium">Individual</span>
                      </label>
                    </div>
                  </div>

                  {/* Primary Contact */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <div className="w-36 flex items-center gap-1.5 text-slate-700 font-semibold">
                      <span>Primary Contact</span>
                      <span title="Salutation, first name, and last name of the contact person" className="cursor-help text-slate-400">ⓘ</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl">
                      <select
                        value={formData.salutation}
                        onChange={(e) => setFormData({ ...formData, salutation: e.target.value })}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Miss">Miss</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleAutoSuggestDisplayName('firstName', e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleAutoSuggestDisplayName('lastName', e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <div className="w-36 text-slate-700 font-semibold">
                      <span>Company Name</span>
                    </div>
                    <div className="flex-1 max-w-xl">
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={formData.companyName}
                        onChange={(e) => handleAutoSuggestDisplayName('companyName', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  {/* Display Name* */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <div className="w-36 flex items-center gap-1.5 font-semibold">
                      <span className="text-[#ec008c]">Display Name*</span>
                      <span title="This name will appear on invoices and customer statements" className="cursor-help text-slate-400">ⓘ</span>
                    </div>
                    <div className="flex-1 max-w-xl relative">
                      <input
                        type="text"
                        required
                        placeholder="Select or type to add"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium"
                      />
                      {(formData.companyName || formData.firstName) && (
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                          <span>Suggestions:</span>
                          {formData.companyName && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, name: formData.companyName })}
                              className="px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium border border-sky-200"
                            >
                              {formData.companyName}
                            </button>
                          )}
                          {formData.firstName && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  name: `${formData.salutation} ${formData.firstName} ${formData.lastName}`.trim(),
                                })
                              }
                              className="px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium border border-sky-200"
                            >
                              {`${formData.salutation} ${formData.firstName} ${formData.lastName}`.trim()}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <div className="w-36 flex items-center gap-1.5 text-slate-700 font-semibold">
                      <span>Email Address</span>
                      <span title="Primary email address for invoice deliveries" className="cursor-help text-slate-400">ⓘ</span>
                    </div>
                    <div className="flex-1 max-w-xl relative">
                      <div className="relative flex rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                        <span className="inline-flex items-center px-3 text-slate-400 bg-slate-50">
                          <Mail className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="email"
                          placeholder="client@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <div className="w-36 flex items-center gap-1.5 text-slate-700 font-semibold">
                      <span>Phone</span>
                      <span title="Work phone and primary mobile number" className="cursor-help text-slate-400">ⓘ</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                      {/* Work Phone */}
                      <div className="flex rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                        <span className="inline-flex items-center px-2.5 text-slate-500 bg-slate-50 font-mono text-[11px] border-r border-slate-200">
                          +91 ▾
                        </span>
                        <input
                          type="text"
                          placeholder="Work Phone"
                          value={formData.workPhone}
                          onChange={(e) => setFormData({ ...formData, workPhone: e.target.value })}
                          className="w-full px-2.5 py-2 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
                        />
                      </div>

                      {/* Mobile */}
                      <div className="flex rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                        <span className="inline-flex items-center px-2.5 text-slate-500 bg-slate-50 font-mono text-[11px] border-r border-slate-200">
                          +91 ▾
                        </span>
                        <input
                          type="text"
                          placeholder="Mobile"
                          value={formData.mobile}
                          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                          className="w-full px-2.5 py-2 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Language */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                    <div className="w-36 flex items-center gap-1.5 text-slate-700 font-semibold">
                      <span>Customer Language</span>
                      <span title="Preferred language for automated billing emails" className="cursor-help text-slate-400">ⓘ</span>
                    </div>
                    <div className="flex-1 max-w-xl">
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Marathi">Marathi (मराठी)</option>
                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                        <option value="Tamil">Tamil (தமிழ்)</option>
                        <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation (matches screenshot) */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto">
                    {[
                      { id: 'other', label: 'Other Details' },
                      { id: 'address', label: 'Address' },
                      { id: 'contact_persons', label: 'Contact Persons' },
                      { id: 'custom_fields', label: 'Custom Fields' },
                      { id: 'remarks', label: 'Remarks' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`pb-2.5 text-xs font-semibold tracking-wide transition border-b-2 whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-[#00a3e0] text-[#00a3e0]'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content: Other Details */}
                {activeTab === 'other' && (
                  <div className="space-y-4 pt-2">
                    {/* PAN */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                      <div className="w-36 flex items-center gap-1.5 text-slate-700 font-semibold">
                        <span>PAN</span>
                        <span title="Permanent Account Number (10 digits)" className="cursor-help text-slate-400">ⓘ</span>
                      </div>
                      <div className="flex-1 max-w-xl">
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="ABCDE1234F"
                          value={formData.pan}
                          onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono uppercase placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* GSTIN Field */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                      <div className="w-36 flex items-center gap-1.5 text-slate-700 font-semibold">
                        <span>GSTIN</span>
                        <span title="Goods and Services Tax Identification Number" className="cursor-help text-slate-400">ⓘ</span>
                      </div>
                      <div className="flex-1 max-w-xl">
                        <input
                          type="text"
                          maxLength={15}
                          placeholder="27ABCDE1234F1Z5"
                          value={formData.gstin}
                          onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono uppercase placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                      <div className="w-36 text-slate-700 font-semibold">
                        <span>Currency</span>
                      </div>
                      <div className="flex-1 max-w-xl">
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="INR - Indian Rupee">INR - Indian Rupee</option>
                          <option value="USD - United States Dollar">USD - United States Dollar</option>
                          <option value="EUR - Euro">EUR - Euro</option>
                          <option value="AED - UAE Dirham">AED - UAE Dirham</option>
                        </select>
                      </div>
                    </div>

                    {/* Accounts Receivable */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                      <div className="w-36 flex items-center gap-1.5 text-slate-700 font-semibold">
                        <span>Accounts Receivable</span>
                        <span title="The ledger account tracking invoice receivables for this client" className="cursor-help text-slate-400">ⓘ</span>
                      </div>
                      <div className="flex-1 max-w-xl">
                        <select
                          value={formData.accountReceivable}
                          onChange={(e) => setFormData({ ...formData, accountReceivable: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="Accounts Receivable">Accounts Receivable</option>
                          <option value="Trade Debtors">Trade Debtors</option>
                          <option value="Client Advance Ledger">Client Advance Ledger</option>
                        </select>
                      </div>
                    </div>

                    {/* Opening Balance */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                      <div className="w-36 text-slate-700 font-semibold">
                        <span>Opening Balance</span>
                      </div>
                      <div className="flex-1 max-w-xl">
                        <div className="flex rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500">
                          <span className="inline-flex items-center px-3 text-slate-500 bg-slate-50 font-mono select-none border-r border-slate-200">
                            INR
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.openingBalance === 0 ? '' : formData.openingBalance}
                            onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-transparent text-slate-900 font-mono placeholder-slate-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Terms */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                      <div className="w-36 text-slate-700 font-semibold">
                        <span>Payment Terms</span>
                      </div>
                      <div className="flex-1 max-w-xl">
                        <select
                          value={formData.paymentTerms}
                          onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="Due on Receipt">Due on Receipt</option>
                          <option value="Net 15">Net 15</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 45">Net 45</option>
                          <option value="Net 60">Net 60</option>
                          <option value="Due end of the month">Due end of the month</option>
                          <option value="Due end of next month">Due end of next month</option>
                        </select>
                      </div>
                    </div>

                    {/* Enable Portal? */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                      <div className="w-36 flex items-center gap-1.5 text-slate-700 font-semibold">
                        <span>Enable Portal?</span>
                        <span title="Allow client to view invoices and pay online through customer portal" className="cursor-help text-slate-400">ⓘ</span>
                      </div>
                      <div className="flex-1 max-w-xl">
                        <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            checked={formData.enablePortal}
                            onChange={(e) => setFormData({ ...formData, enablePortal: e.target.checked })}
                            className="w-4 h-4 text-sky-600 bg-white border-slate-300 rounded focus:ring-sky-500"
                          />
                          <span className="font-medium">Allow portal access for this customer</span>
                        </label>
                      </div>
                    </div>

                    {/* Documents Upload */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-8 pt-2">
                      <div className="w-36 text-slate-700 font-semibold">
                        <span>Documents</span>
                      </div>
                      <div className="flex-1 max-w-xl space-y-1">
                        <button
                          type="button"
                          onClick={() => success('File upload dialog ready. Attach contracts or GST certificates.')}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-lg flex items-center gap-2 transition"
                        >
                          <span>Upload File ▾</span>
                        </button>
                        <p className="text-[11px] text-slate-500">You can upload a maximum of 10 files, 10MB each</p>
                      </div>
                    </div>

                    {/* Customer Owner Note */}
                    <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500">
                      <span>Customer Owner: Assign a user as the customer owner to provide access only to the data of this customer. </span>
                      <span className="text-[#00a3e0] hover:underline cursor-pointer font-medium">Learn More</span>
                    </div>
                  </div>
                )}

                {/* Tab Content: Address */}
                {activeTab === 'address' && (
                  <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Billing Address Column */}
                      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Billing Address</h4>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1 font-medium">Attention</label>
                          <input
                            type="text"
                            placeholder="Contact Person or Department"
                            value={formData.billingAttention}
                            onChange={(e) => setFormData({ ...formData, billingAttention: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1 font-medium">Country / Region</label>
                          <input
                            type="text"
                            value={formData.billingCountry}
                            onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1 font-medium">Address Line 1</label>
                          <input
                            type="text"
                            placeholder="Street address, building number"
                            value={formData.billingStreet1}
                            onChange={(e) => setFormData({ ...formData, billingStreet1: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1 font-medium">Address Line 2</label>
                          <input
                            type="text"
                            placeholder="Suite, unit, floor, landmark"
                            value={formData.billingStreet2}
                            onChange={(e) => setFormData({ ...formData, billingStreet2: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1 font-medium">City</label>
                            <input
                              type="text"
                              placeholder="City"
                              value={formData.billingCity}
                              onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1 font-medium">State</label>
                            <input
                              type="text"
                              placeholder="State"
                              value={formData.billingState}
                              onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1 font-medium">Pin Code</label>
                            <input
                              type="text"
                              placeholder="400001"
                              value={formData.billingPincode}
                              onChange={(e) => setFormData({ ...formData, billingPincode: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1 font-medium">Phone</label>
                            <input
                              type="text"
                              placeholder="Phone"
                              value={formData.billingPhone}
                              onChange={(e) => setFormData({ ...formData, billingPhone: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address Column */}
                      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Shipping Address</h4>
                          <button
                            type="button"
                            onClick={handleCopyBillingAddress}
                            className="text-[11px] text-[#00a3e0] hover:text-[#0284c7] font-semibold underline"
                          >
                            Copy billing address
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1 font-medium">Attention</label>
                          <input
                            type="text"
                            placeholder="Receiving contact or site supervisor"
                            value={formData.shippingAttention}
                            onChange={(e) => setFormData({ ...formData, shippingAttention: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1 font-medium">Country / Region</label>
                          <input
                            type="text"
                            value={formData.shippingCountry}
                            onChange={(e) => setFormData({ ...formData, shippingCountry: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1 font-medium">Address Line 1</label>
                          <input
                            type="text"
                            placeholder="Delivery site or venue address"
                            value={formData.shippingStreet1}
                            onChange={(e) => setFormData({ ...formData, shippingStreet1: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-600 mb-1 font-medium">Address Line 2</label>
                          <input
                            type="text"
                            placeholder="Plot number, gate, landmark"
                            value={formData.shippingStreet2}
                            onChange={(e) => setFormData({ ...formData, shippingStreet2: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1 font-medium">City</label>
                            <input
                              type="text"
                              placeholder="City"
                              value={formData.shippingCity}
                              onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1 font-medium">State</label>
                            <input
                              type="text"
                              placeholder="State"
                              value={formData.shippingState}
                              onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1 font-medium">Pin Code</label>
                            <input
                              type="text"
                              placeholder="400001"
                              value={formData.shippingPincode}
                              onChange={(e) => setFormData({ ...formData, shippingPincode: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-600 mb-1 font-medium">Phone</label>
                            <input
                              type="text"
                              placeholder="Phone"
                              value={formData.shippingPhone}
                              onChange={(e) => setFormData({ ...formData, shippingPhone: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content: Contact Persons */}
                {activeTab === 'contact_persons' && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <p className="text-xs text-slate-700">
                      Primary contact is registered as: <strong className="text-slate-900">{formData.salutation} {formData.firstName} {formData.lastName}</strong>.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Additional contact persons for billing escalations, dispatch notifications, and proof approvals can be associated during invoice or order generation.
                    </p>
                  </div>
                )}

                {/* Tab Content: Custom Fields */}
                {activeTab === 'custom_fields' && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <p className="text-xs text-slate-700 font-medium">
                      Customer Status:
                    </p>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-sky-500 text-xs"
                    >
                      <option value="ACTIVE">Active Customer</option>
                      <option value="CLIENT">Verified Client</option>
                      <option value="LEAD">Prospective Lead</option>
                      <option value="INACTIVE">Inactive / Archived</option>
                    </select>
                  </div>
                )}

                {/* Tab Content: Remarks */}
                {activeTab === 'remarks' && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Remarks / Internal Studio Notes (For internal team only)
                    </label>
                    <textarea
                      rows={5}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Special design guidelines, color profiles, credit history, delivery preferences..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                )}

                {/* Bottom Action Buttons (matches screenshot) */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#00a3e0] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-500/20 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Customer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* GSTIN Prefill Modal */}
        {gstPrefillOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#00a3e0]" />
                  <span>Prefill from GSTIN Portal</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setGstPrefillOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the 15-character GSTIN number to automatically extract state code, PAN number, and register legal business profile:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={prefillGstin}
                  onChange={(e) => setPrefillGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono uppercase focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setGstPrefillOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyGstPrefill}
                  className="px-4 py-2 bg-gradient-to-r from-[#00a3e0] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20"
                >
                  Apply & Prefill
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeleteCustomer}
          isLoading={deleting}
          title="Delete Customer Profile"
          message={`Are you sure you want to delete customer "${customerToDelete?.name}"? If they have invoices or orders, you may archive or mark them inactive instead.`}
          confirmText="Delete Customer"
        />
      </div>
    </DashboardLayout>
  );
}
