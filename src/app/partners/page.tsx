'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { formatCurrency } from '@/lib/utils';
import { ALL_NAV_ITEMS } from '@/components/Sidebar';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  DollarSign,
  X,
  Lock,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Key,
  Shield,
  ShieldAlert,
  ShieldOff,
  CheckSquare,
  Square,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [rawPartners, setRawPartners] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalJobCost: 0,
    totalCosts: 0,
    netProfit: 0,
  });
  const [validation, setValidation] = useState<any>({
    isValid: false,
    totalPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  // Date filters for partner profit calculation
  const [dateFilter, setDateFilter] = useState('all_time');
  const [customFrom] = useState('');
  const [customTo] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    profitPercentage: 0,
    isActive: true,
    notes: '',
    permissions: ['dashboard', 'orders', 'invoices', 'reports'] as string[],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswordCardIds, setVisiblePasswordCardIds] = useState<{ [id: string]: boolean }>({});

  // Credentials Generated Modal
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    permissions?: string[];
  } | null>(null);

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Revoke Login Confirm State
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [partnerToRevoke, setPartnerToRevoke] = useState<any>(null);
  const [revoking, setRevoking] = useState(false);

  const { success, error } = useToast();

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Prime@${code}`;
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      let url = `/api/partners?`;
      const now = new Date();
      if (dateFilter === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        url += `&fromDate=${start}`;
      } else if (dateFilter === 'this_year') {
        const start = new Date(now.getFullYear(), 0, 1).toISOString();
        url += `&fromDate=${start}`;
      } else if (dateFilter === 'custom' && customFrom && customTo) {
        url += `&fromDate=${customFrom}&toDate=${customTo}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setPartners(data.partners || []);
      setRawPartners(data.rawPartners || []);
      setFinancials(data.financials || {});
      setValidation(data.validation || { isValid: false, totalPercentage: 0 });
    } catch {
      error('Failed to load partners data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [dateFilter]);

  const openAddModal = () => {
    setEditingPartner(null);
    const activeSum = rawPartners.filter((p) => p.isActive).reduce((acc, p) => acc + p.profitPercentage, 0);
    const suggested = Math.max(0, 100 - activeSum);

    setFormData({
      name: '',
      email: '',
      phone: '',
      password: generateRandomPassword(),
      profitPercentage: Number(suggested.toFixed(2)),
      isActive: true,
      notes: '',
      permissions: ['dashboard', 'orders', 'invoices', 'reports'],
    });
    setShowPassword(true);
    setModalOpen(true);
  };

  const openEditModal = (partner: any) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name || '',
      email: partner.email || '',
      phone: partner.phone || '',
      password: '',
      profitPercentage: partner.profitPercentage || 0,
      isActive: partner.isActive !== undefined ? partner.isActive : true,
      notes: partner.notes || '',
      permissions: Array.isArray(partner.parsedPermissions)
        ? partner.parsedPermissions
        : ['dashboard', 'orders', 'invoices', 'reports'],
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter((p) => p !== permId) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permId] };
      }
    });
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      error('Partner name is required');
      return;
    }

    if (!formData.email.trim()) {
      error('Partner email is required for login credentials');
      return;
    }

    if (formData.profitPercentage <= 0 || formData.profitPercentage > 100) {
      error('Profit percentage must be between 0.01% and 100%');
      return;
    }

    setSaving(true);
    try {
      if (editingPartner) {
        const res = await fetch(`/api/partners/${editingPartner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update partner');
        success('Partner updated successfully');

        if (data.credentials) {
          setGeneratedCredentials(data.credentials);
          setCredentialsModalOpen(true);
        }
      } else {
        const res = await fetch('/api/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add partner');
        success('Partner added and login credentials generated!');

        if (data.credentials) {
          setGeneratedCredentials(data.credentials);
          setCredentialsModalOpen(true);
        }
      }
      setModalOpen(false);
      fetchPartners();
    } catch (err: any) {
      error(err.message || 'Error saving partner');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeLogin = async () => {
    if (!partnerToRevoke) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/partners/${partnerToRevoke.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeLogin: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke login');
      success(`Login credentials revoked for ${partnerToRevoke.name}`);
      setRevokeConfirmOpen(false);
      fetchPartners();
    } catch (err: any) {
      error(err.message || 'Error revoking login');
    } finally {
      setRevoking(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!partnerToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/partners/${partnerToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete partner');
      success('Partner deleted successfully');
      setDeleteConfirmOpen(false);
      fetchPartners();
    } catch (err: any) {
      error(err.message || 'Error deleting partner');
    } finally {
      setDeleting(false);
    }
  };

  const copyCredentialsText = () => {
    if (!generatedCredentials) return;
    const loginUrl = `${window.location.origin}/login`;
    const text = `Prime Sublimation Partner Login Credentials:\n\nName: ${generatedCredentials.name}\nLogin URL: ${loginUrl}\nEmail: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}\nRole: ${generatedCredentials.role}`;
    navigator.clipboard.writeText(text);
    success('Credentials copied to clipboard!');
  };

  const copyPartnerCardDetails = (partner: any) => {
    const loginUrl = `${window.location.origin}/login`;
    const pwd = partner.passwordHint || '•••••••• (Encrypted in DB)';
    const text = `Prime Sublimation Partner Login Credentials:\n\nName: ${partner.name}\nLogin URL: ${loginUrl}\nEmail: ${partner.email}\nPassword: ${pwd}\nRole: PARTNER`;
    navigator.clipboard.writeText(text);
    success('Partner login details copied to clipboard!');
  };

  const toggleCardPasswordVisibility = (partnerId: string) => {
    setVisiblePasswordCardIds((prev) => ({
      ...prev,
      [partnerId]: !prev[partnerId],
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Partners & Profit Sharing Distribution"
          subtitle="Configure partner equity percentages, manage portal login credentials, and configure visible sidebar menus"
          actionText="Add Partner"
          onActionClick={openAddModal}
          actionIcon={<Plus className="w-4 h-4" />}
        />

        {/* 100% Allocation Validation Banner */}
        <div
          className={`p-5 rounded-3xl border shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
            validation.isValid
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border ${
                validation.isValid
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {validation.isValid ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-base font-bold flex items-center gap-2">
                <span>Profit Split Configuration:</span>
                <span className="font-mono text-lg font-black">
                  {validation.totalPercentage}% / 100.00%
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {validation.isValid
                  ? 'Active partner percentage allocation is perfectly balanced at 100.00%.'
                  : validation.error || `Current total is ${validation.totalPercentage}%. Active partners must equal exactly 100%.`}
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 self-start sm:self-auto">
            {rawPartners.filter((p) => p.isActive).length} Active Partner(s)
          </div>
        </div>

        {/* Financial Net Profit Overview Bar with Date Filter */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Live Profit Calculator</h3>
              <p className="text-xs text-slate-400">Calculated directly from received income, expenses and job costs</p>
            </div>

            <div className="flex items-center gap-2">
              {[
                { id: 'this_month', label: 'This Month' },
                { id: 'this_year', label: 'This Year' },
                { id: 'all_time', label: 'All Time' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDateFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    dateFilter === tab.id
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Financial Breakdown KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Total Revenue (Income)</span>
              <div className="text-xl font-black text-white font-mono mt-1">
                {formatCurrency(financials.totalRevenue)}
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">Cleared Client Inflow</p>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Total Studio Expenses</span>
              <div className="text-xl font-black text-rose-400 font-mono mt-1">
                {formatCurrency(financials.totalExpenses)}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Operational Overheads</p>
            </div>

            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Total Product/Job Costs</span>
              <div className="text-xl font-black text-slate-300 font-mono mt-1">
                {formatCurrency(financials.totalJobCost)}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Item Cost Base</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-950/50 to-slate-950/70 rounded-2xl border border-emerald-500/30">
              <span className="text-xs text-emerald-300 font-semibold">Distributable Net Profit</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {formatCurrency(financials.netProfit)}
              </div>
              <p className="text-[10px] text-emerald-500/80 mt-1">For Partner Distribution</p>
            </div>
          </div>
        </div>

        {/* Partner Profit Split & Credentials Management Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => {
            const isPasswordVisible = !!visiblePasswordCardIds[partner.id];
            const hasLogin = partner.hasLoginAccount;
            const perms = Array.isArray(partner.parsedPermissions) ? partner.parsedPermissions : [];

            return (
              <div
                key={partner.id}
                className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
                  partner.isActive
                    ? 'bg-slate-900/80 border-slate-800'
                    : 'bg-slate-900/40 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-brand-500/20 shrink-0">
                        {partner.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{partner.name}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              partner.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {partner.isActive ? 'Active Partner' : 'Inactive'}
                          </span>
                          {hasLogin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <Shield className="w-2.5 h-2.5" /> Portal Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <ShieldAlert className="w-2.5 h-2.5" /> No Login
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-brand-400 font-mono">
                        {partner.profitPercentage}%
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Profit Share</span>
                    </div>
                  </div>

                  {/* Partner Contact & Info */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                    {partner.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span className="truncate font-mono">{partner.email}</span>
                      </div>
                    )}
                    {partner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        <span>{partner.phone}</span>
                      </div>
                    )}
                    {partner.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-0.5">{partner.notes}</p>
                    )}
                  </div>

                  {/* SEE CREDENTIALS & PERMISSIONS SECTION */}
                  <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span className="flex items-center gap-1.5 text-brand-400">
                        <Key className="w-3.5 h-3.5" /> Login Credentials
                      </span>
                      {hasLogin && (
                        <button
                          onClick={() => copyPartnerCardDetails(partner)}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                          title="Copy Login Details"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      )}
                    </div>

                    {hasLogin ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-semibold">Email:</span>
                          <span className="font-mono text-white text-[11px] truncate max-w-[170px]">
                            {partner.email}
                          </span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-semibold">Password:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-emerald-400 text-[11px] font-bold">
                              {isPasswordVisible
                                ? partner.passwordHint || 'Default / Encrypted'
                                : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleCardPasswordVisibility(partner.id)}
                              className="text-slate-400 hover:text-white p-0.5"
                            >
                              {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Visible Sidebar Menus in Portal */}
                        <div className="pt-1">
                          <div className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                            <span>Portal Sidebar Menus:</span>
                            <span className="text-[9px] text-brand-400">{perms.length} modules</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {perms.map((pId: string) => (
                              <span
                                key={pId}
                                className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700/60 uppercase"
                              >
                                {pId}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-400/80 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        Login access is revoked or not generated yet. Click &quot;Edit / Credentials&quot; to enable.
                      </div>
                    )}

                    {/* Assigned Orders quick view */}
                    <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-800/80">
                      <span className="text-slate-400 flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-brand-400" /> Assigned Orders:
                      </span>
                      <Link
                        href={`/orders?partnerId=${partner.id}`}
                        className="text-brand-400 hover:underline font-bold flex items-center gap-1"
                      >
                        {partner.assignedOrdersCount || 0} Order(s) <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Dynamic Calculated Share Amount */}
                  <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-0.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Calculated Net Share:</span>
                      <span className="text-emerald-400 font-semibold">{partner.profitPercentage}% of Profit</span>
                    </div>
                    <div className="text-lg font-black text-white font-mono flex items-center justify-between">
                      <span>{formatCurrency(partner.shareAmount || 0)}</span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons (Edit, Revoke Login, Delete) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-1.5">
                  <button
                    onClick={() => openEditModal(partner)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Edit & Portal</span>
                  </button>

                  {hasLogin && (
                    <button
                      onClick={() => {
                        setPartnerToRevoke(partner);
                        setRevokeConfirmOpen(true);
                      }}
                      title="Revoke / Delete Partner Login Credentials"
                      className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                    >
                      <ShieldOff className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setPartnerToDelete(partner);
                      setDeleteConfirmOpen(true);
                    }}
                    title="Delete Partner Profile Completely"
                    className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {partners.length === 0 && !loading && (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
            <p className="text-slate-400 text-sm">No partners added yet.</p>
            <button
              onClick={openAddModal}
              className="mt-3 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition"
            >
              Add First Partner
            </button>
          </div>
        )}

        {/* Add / Edit Partner & Portal Permissions Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingPartner ? 'Edit Partner & Portal Permissions' : 'Add Partner & Generate Login'}
                    </h3>
                    <p className="text-xs text-slate-400">Configure equity %, login credentials, and allowed sidebar menus</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePartner} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Partner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Partner A / Rajesh Nair"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Partner Email (Login Username) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="partner@primesublimation.in"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>

                {/* Login Password Generation Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-300">
                      {editingPartner ? 'Reset / Set New Password (Optional)' : 'Auto-Generated Login Password *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                      className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Generate New
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingPartner}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingPartner ? 'Leave blank to keep existing password' : 'e.g. Prime@7384'}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Configure Allowed Sidebar Menu for Partner's Portal */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">
                        Visible Sidebar Menus in Partner Portal
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Choose which modules this partner can view in their login portal
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          permissions:
                            formData.permissions.length === ALL_NAV_ITEMS.length
                              ? ['dashboard', 'orders']
                              : ALL_NAV_ITEMS.map((n) => n.id),
                        })
                      }
                      className="text-[10px] text-brand-400 font-semibold hover:underline"
                    >
                      {formData.permissions.length === ALL_NAV_ITEMS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {ALL_NAV_ITEMS.map((item) => {
                      const isSelected = formData.permissions.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => togglePermission(item.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-left border transition ${
                            isSelected
                              ? 'bg-brand-500/10 border-brand-500/40 text-brand-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                          <span className="text-[11px] font-medium truncate">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Phone (Optional)</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Profit Percentage (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="100"
                        required
                        value={formData.profitPercentage}
                        onChange={(e) => setFormData({ ...formData, profitPercentage: Number(e.target.value) })}
                        placeholder="40"
                        className="w-full pl-3 pr-7 py-2 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white font-mono focus:border-brand-500"
                      />
                      <Percent className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Notes / Responsibilities</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Co-founder, Production Head..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="partnerActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-800 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="partnerActive" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Active Partner (Included in profit share calculation)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingPartner ? 'Update Partner & Permissions' : 'Save & Create Credentials'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Partner Login Credentials Success Modal */}
        {credentialsModalOpen && generatedCredentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-6 bg-gradient-to-b from-emerald-950/40 to-slate-900 border-b border-slate-800 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Partner Login Credentials</h3>
                <p className="text-xs text-slate-300">
                  Login account has been successfully configured for <span className="font-bold text-white">{generatedCredentials.name}</span>.
                </p>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Login Email / Username</span>
                    <div className="font-mono text-sm font-semibold text-white mt-0.5 break-all">
                      {generatedCredentials.email}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Password</span>
                    <div className="font-mono text-base font-bold text-emerald-400 mt-0.5 select-all">
                      {generatedCredentials.password}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Role</span>
                    <div className="font-semibold text-brand-400 mt-0.5">
                      {generatedCredentials.role} (Portal Access)
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyCredentialsText}
                    className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Login Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCredentialsModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revoke Login Confirmation Modal */}
        <ConfirmModal
          isOpen={revokeConfirmOpen}
          onClose={() => setRevokeConfirmOpen(false)}
          onConfirm={handleRevokeLogin}
          isLoading={revoking}
          title="Revoke Partner Login Access"
          message={`Are you sure you want to revoke portal login access for partner "${partnerToRevoke?.name}" (${partnerToRevoke?.email})? Their user login account will be deleted, but their partner profit share profile will be preserved.`}
          confirmText="Revoke Login Access"
        />

        {/* Delete Partner Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={handleDeletePartner}
          isLoading={deleting}
          title="Delete Partner Completely"
          message={`Are you sure you want to completely remove partner "${partnerToDelete?.name}"? Make sure to readjust other partners to maintain a 100% total split.`}
          confirmText="Delete Partner"
        />
      </div>
    </DashboardLayout>
  );
}
