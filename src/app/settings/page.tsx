'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import {
  Settings,
  Building,
  Save,
  CreditCard,
  FileText,
  Percent,
  Sparkles,
  Phone,
  Mail,
  Globe,
  MapPin,
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    companyName: 'Prime Sublimation',
    logoUrl: '',
    address: '402 Creative Heights, Design District, Bangalore - 560001',
    phone: '+91 98765 43210',
    email: 'accounts@pixelcraftstudio.in',
    website: 'https://pixelcraftstudio.in',
    gstin: '29AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    invoicePrefix: 'INV-',
    invoiceNumberStart: 1001,
    orderPrefix: 'ORD-',
    orderNumberStart: 1001,
    defaultTaxRate: 18.0,
    currency: 'INR',
    currencySymbol: '₹',
    invoiceTerms: '1. 50% advance for graphic design / print orders.\n2. Invoices are due within 15 days of issue.\n3. Revisions beyond 3 iterations will be billed at hourly rates.',
    paymentDetails: 'Payment can be made via UPI or NEFT/IMPS direct bank transfer.',
    bankAccountName: 'PixelCraft Design Studio LLP',
    bankAccountNumber: '98765432101234',
    bankIfsc: 'HDFC0001234',
    bankName: 'HDFC Bank',
    bankBranch: 'MG Road, Bangalore',
    upiId: 'pixelcraft@hdfcbank',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch {
      error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      success('Company and invoice settings updated successfully!');
    } catch (err: any) {
      error(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto pb-12">
        <Header
          title="Company & Invoice Settings"
          subtitle="Configure business details, GSTIN, bank accounts, UPI ID, and invoice prefixes"
        />

        {/* Company Profile Section */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Studio Profile & Branding</h3>
              <p className="text-xs text-slate-400">These details appear on your invoices and client receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Company / Studio Name *</label>
              <input
                type="text"
                required
                value={settings.companyName || ''}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Company Logo URL</label>
              <input
                type="text"
                value={settings.logoUrl || ''}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://yourdomain.com/logo.png"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">GSTIN</label>
              <input
                type="text"
                value={settings.gstin || ''}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                placeholder="29AAAAA0000A1Z5"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">PAN</label>
              <input
                type="text"
                value={settings.pan || ''}
                onChange={(e) => setSettings({ ...settings, pan: e.target.value.toUpperCase() })}
                placeholder="AAAAA0000A"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:border-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">Full Studio Address</label>
              <textarea
                rows={2}
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Invoice Numbering & Currency Defaults */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Invoice & Order Defaults</h3>
              <p className="text-xs text-slate-400">Numbering sequences, prefix codes, and standard taxes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={settings.invoicePrefix || 'INV-'}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Invoice Start #</label>
              <input
                type="number"
                value={settings.invoiceNumberStart || 1001}
                onChange={(e) => setSettings({ ...settings, invoiceNumberStart: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Order Prefix</label>
              <input
                type="text"
                value={settings.orderPrefix || 'ORD-'}
                onChange={(e) => setSettings({ ...settings, orderPrefix: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Default GST / Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.defaultTaxRate || 18.0}
                onChange={(e) => setSettings({ ...settings, defaultTaxRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Currency Code</label>
              <input
                type="text"
                value={settings.currency || 'INR'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white uppercase focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.currencySymbol || '₹'}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-brand-500"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-300 mb-1">Standard Invoice Terms & Conditions</label>
            <textarea
              rows={3}
              value={settings.invoiceTerms || ''}
              onChange={(e) => setSettings({ ...settings, invoiceTerms: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-brand-500"
            />
          </div>
        </div>

        {/* Bank & UPI Details */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Bank & UPI Payment Details</h3>
              <p className="text-xs text-slate-400">Printed on invoice footers for client direct settlement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Bank Account Holder Name</label>
              <input
                type="text"
                value={settings.bankAccountName || ''}
                onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={settings.bankAccountNumber || ''}
                onChange={(e) => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">IFSC Code</label>
              <input
                type="text"
                value={settings.bankIfsc || ''}
                onChange={(e) => setSettings({ ...settings, bankIfsc: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Bank Name & Branch</label>
              <input
                type="text"
                value={settings.bankName || ''}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                placeholder="e.g. HDFC Bank, Indiranagar"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-300 mb-1">UPI ID / VPA</label>
              <input
                type="text"
                value={settings.upiId || ''}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                placeholder="e.g. yourstudio@okhdfcbank"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold text-emerald-400 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-brand-600/30 transition transform active:scale-98 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
