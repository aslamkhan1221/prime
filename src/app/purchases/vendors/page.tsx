'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import {
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  X,
  Check,
  CreditCard,
  MapPin,
  FileText,
  Shield,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState<'other' | 'address' | 'bank' | 'remarks'>('other');

  const { success, error } = useToast();

  // Form State matching Screenshot 3
  const [form, setForm] = useState({
    salutation: 'Mr.',
    firstName: '',
    lastName: '',
    companyName: '',
    displayName: '',
    email: '',
    workPhone: '',
    mobilePhone: '',
    language: 'English',
    pan: '',
    isMsmeRegistered: false,
    currency: 'INR',
    openingBalance: 0,
    paymentTerms: 'Due on Receipt',
    tds: '',
    enablePortal: false,
    address: '',
    city: '',
    state: '',
    pincode: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    remarks: '',
  });

  const fetchVendors = async () => {
    try {
      const res = await fetch(`/api/purchases/vendors?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.vendors) {
        setVendors(data.vendors);
      }
    } catch {
      error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName) {
      error('Display name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/purchases/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save vendor');

      success('Vendor created successfully');
      setModalOpen(false);
      // Reset form
      setForm({
        salutation: 'Mr.',
        firstName: '',
        lastName: '',
        companyName: '',
        displayName: '',
        email: '',
        workPhone: '',
        mobilePhone: '',
        language: 'English',
        pan: '',
        isMsmeRegistered: false,
        currency: 'INR',
        openingBalance: 0,
        paymentTerms: 'Due on Receipt',
        tds: '',
        enablePortal: false,
        address: '',
        city: '',
        state: '',
        pincode: '',
        bankAccountName: '',
        bankAccountNumber: '',
        bankIfsc: '',
        bankName: '',
        remarks: '',
      });
      fetchVendors();
    } catch (err: any) {
      error(err.message || 'Error creating vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Vendors"
          subtitle="Manage raw material suppliers, flex/vinyl printers, paper mills, and vendor payables"
          actionText="New Vendor"
          actionIcon={<Plus className="w-4 h-4" />}
          onActionClick={() => setModalOpen(true)}
        />

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vendor name, company, email, phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total Vendors: <span className="font-bold text-slate-800">{vendors.length}</span>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Vendor Name</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Payment Terms</th>
                  <th className="py-3.5 px-4 text-right">Payables (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading vendors...
                    </td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800">No vendors found</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Add suppliers for substrates, vinyl banners, inks, printing art cards, and binding vendors.
                      </p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-500 shadow-md shadow-brand-500/20 transition"
                      >
                        + Add First Vendor
                      </button>
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-200 text-brand-600 font-bold flex items-center justify-center text-xs">
                          {v.displayName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <span>{v.displayName}</span>
                          {v.isMsmeRegistered ? (
                            <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-semibold">
                              MSME
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{v.companyName || '-'}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {v.email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{v.email}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {v.mobilePhone || v.workPhone ? (
                          <div className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{v.mobilePhone || v.workPhone}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{v.paymentTerms || 'Due on Receipt'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(v.openingBalance || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Vendor Modal (Matching Screenshot 3) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">New Vendor</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body matching Screenshot 3 */}
              <form onSubmit={handleCreateVendor} className="p-6 space-y-4 text-xs max-h-[calc(85vh-120px)] overflow-y-auto">
                {/* Primary Contact */}
                <div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
                    <span>Primary Contact</span>
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <select
                      value={form.salutation}
                      onChange={(e) => setForm({ ...form, salutation: e.target.value })}
                      className="col-span-3 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-1 focus:ring-brand-500"
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
                      value={form.firstName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          firstName: val,
                          displayName: form.displayName || `${val} ${form.lastName}`.trim(),
                        });
                      }}
                      className="col-span-4 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={form.lastName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          lastName: val,
                          displayName: form.displayName || `${form.firstName} ${val}`.trim(),
                        });
                      }}
                      className="col-span-5 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g. Star Flex Media Ltd"
                  />
                </div>

                {/* Display Name* */}
                <div>
                  <div className="flex items-center gap-1 font-semibold text-rose-600 mb-1">
                    <span>Display Name*</span>
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-slate-900 font-bold focus:ring-1 focus:ring-brand-500"
                    placeholder="Select or type to add"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-brand-500"
                    placeholder="vendor@company.com"
                  />
                </div>

                {/* Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Work Phone</label>
                    <div className="flex">
                      <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-600">
                        +91
                      </span>
                      <input
                        type="text"
                        value={form.workPhone}
                        onChange={(e) => setForm({ ...form, workPhone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-r-xl text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-brand-500 font-mono"
                        placeholder="Work Phone"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                    <div className="flex">
                      <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-600">
                        +91
                      </span>
                      <input
                        type="text"
                        value={form.mobilePhone}
                        onChange={(e) => setForm({ ...form, mobilePhone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-r-xl text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-brand-500 font-mono"
                        placeholder="Mobile"
                      />
                    </div>
                  </div>
                </div>

                {/* Tabs matching Screenshot 3 */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 border-b border-slate-200 mb-4 overflow-x-auto">
                    {[
                      { id: 'other', label: 'Other Details' },
                      { id: 'address', label: 'Address' },
                      { id: 'bank', label: 'Bank Details' },
                      { id: 'remarks', label: 'Remarks' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setModalTab(t.id as any)}
                        className={`pb-2 px-3 font-semibold transition border-b-2 text-xs whitespace-nowrap ${
                          modalTab === t.id
                            ? 'border-brand-600 text-brand-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB: OTHER DETAILS (Screenshot 3) */}
                  {modalTab === 'other' && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-1 font-semibold text-slate-700 mb-1">
                          <span>PAN</span>
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={form.pan}
                          onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono uppercase"
                          placeholder="ABCDE1234F"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isMsmeRegistered}
                          onChange={(e) => setForm({ ...form, isMsmeRegistered: e.target.checked })}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <span>This vendor is MSME registered</span>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                          <select
                            value={form.currency}
                            onChange={(e) => setForm({ ...form, currency: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                          >
                            <option value="INR">INR - Indian Rupee</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Opening Balance (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={form.openingBalance}
                            onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                          <select
                            value={form.paymentTerms}
                            onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                          >
                            <option value="Due on Receipt">Due on Receipt</option>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                            <option value="Net 60">Net 60</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">TDS</label>
                          <select
                            value={form.tds}
                            onChange={(e) => setForm({ ...form, tds: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                          >
                            <option value="">Select a Tax</option>
                            <option value="TDS 1%">TDS 1% (Sec 194C)</option>
                            <option value="TDS 2%">TDS 2% (Sec 194C Company)</option>
                            <option value="TDS 10%">TDS 10% (Sec 194J Professional)</option>
                          </select>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={form.enablePortal}
                          onChange={(e) => setForm({ ...form, enablePortal: e.target.checked })}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                        />
                        <span>Allow portal access for this vendor</span>
                      </label>
                    </div>
                  )}

                  {/* TAB: ADDRESS */}
                  {modalTab === 'address' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                        <textarea
                          rows={2}
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                          placeholder="Plot / Street / Area"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">City</label>
                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">State</label>
                          <input
                            type="text"
                            value={form.state}
                            onChange={(e) => setForm({ ...form, state: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                          <input
                            type="text"
                            value={form.pincode}
                            onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: BANK DETAILS */}
                  {modalTab === 'bank' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
                        <input
                          type="text"
                          value={form.bankAccountName}
                          onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                          placeholder="Beneficiary Name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                          <input
                            type="text"
                            value={form.bankAccountNumber}
                            onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono"
                            placeholder="Account Number"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">IFSC Code</label>
                          <input
                            type="text"
                            value={form.bankIfsc}
                            onChange={(e) => setForm({ ...form, bankIfsc: e.target.value.toUpperCase() })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono uppercase"
                            placeholder="HDFC0001234"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={form.bankName}
                          onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                          placeholder="e.g. HDFC Bank"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB: REMARKS */}
                  {modalTab === 'remarks' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Remarks</label>
                      <textarea
                        rows={4}
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                        placeholder="Internal notes regarding vendor credit, material grade, delivery timelines..."
                      />
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition flex items-center gap-2"
                  >
                    {saving ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
