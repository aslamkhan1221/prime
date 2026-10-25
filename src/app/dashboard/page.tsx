'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ShoppingBag,
  Users,
  Receipt,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  RefreshCw,
  Eye,
  Calendar,
  Copy,
  Shield,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isPortalMode, setIsPortalMode] = useState(false);
  const [togglingPortal, setTogglingPortal] = useState(false);

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent && !data) setLoading(true);
    try {
      let url = `/api/dashboard?filter=${filter}`;
      if (filter === 'custom' && customFrom && customTo) {
        url += `&fromDate=${customFrom}&toDate=${customTo}`;
      }
      const res = await fetch(url);
      const resData = await res.json();
      setData(resData);
      if (resData?.isPortalMode !== undefined) {
        setIsPortalMode(Boolean(resData.isPortalMode));
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(Boolean(data));
  }, [filter]);

  const handleTogglePortalMode = async () => {
    setTogglingPortal(true);
    try {
      const newMode = !isPortalMode;
      const res = await fetch('/api/portal/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newMode }),
      });
      const resData = await res.json();
      if (resData.success) {
        setIsPortalMode(newMode);
        fetchDashboardData(false);
      }
    } catch (e) {
      console.error('Error toggling portal mode:', e);
    } finally {
      setTogglingPortal(false);
    }
  };

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFrom && customTo) {
      fetchDashboardData();
    }
  };

  const metrics = data?.metrics || {
    totalRevenue: 0,
    totalInvoicesCount: 0,
    totalInvoicesAmount: 0,
    paidInvoicesCount: 0,
    paidInvoicesAmount: 0,
    unpaidInvoicesCount: 0,
    unpaidInvoicesAmount: 0,
    overdueInvoicesCount: 0,
    overdueInvoicesAmount: 0,
    totalOrdersCount: 0,
    totalOrdersAmount: 0,
    totalCustomersCount: 0,
    totalExpenses: 0,
    profit: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Header & Filter toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Studio Dashboard</h1>
              <span className="cmyk-stripe h-2 w-14 rounded-full opacity-90 inline-block" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Prime Print &amp; Services • <span className="text-brand-600 font-semibold">PRINT EVERYTHING YOU WANT</span>
            </p>
          </div>

          {/* Date Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filter === tab.id
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Portal / Admin View Switcher */}
            <button
              onClick={handleTogglePortalMode}
              disabled={togglingPortal}
              title={isPortalMode ? "Switch to Full Admin View (All Invoices)" : "Switch to Portal View (Duplicate Invoices Only)"}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                isPortalMode
                  ? 'bg-purple-600 text-white border-purple-600 shadow-purple-600/20'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border-purple-200'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isPortalMode ? 'Portal View (Duplicate Only)' : 'Portal View'}</span>
            </button>

            <button
              onClick={() => fetchDashboardData()}
              title="Refresh Data"
              className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Portal Mode Notice Banner */}
        {isPortalMode && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 text-purple-900 px-4 py-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse shrink-0" />
              <div>
                <span className="font-bold">Portal Dashboard Active:</span>{' '}
                <span className="text-purple-800">
                  All revenue figures, receivables, invoices count, and recent transactions are displayed strictly as per duplicate invoice records.
                </span>
              </div>
            </div>
            <button
              onClick={handleTogglePortalMode}
              className="text-[11px] font-bold text-purple-700 bg-white hover:bg-purple-100 border border-purple-300 px-3 py-1 rounded-xl transition"
            >
              Switch to Admin View
            </button>
          </div>
        )}

        {/* Custom Date Range Picker bar */}
        {filter === 'custom' && (
          <form onSubmit={handleCustomApply} className="flex flex-wrap items-center gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>From:</span>
              <input
                type="date"
                required
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <span>To:</span>
              <input
                type="date"
                required
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
            >
              Apply Filter
            </button>
          </form>
        )}

        {/* Primary Financial Metric Cards (Grid of 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue (Cyan - matching "PRINT & SERVICES") */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 border-t-4 border-t-brand-500 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Actual Received Inflow
              </p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 border-t-4 border-t-emerald-500 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Profit</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className={`text-2xl font-black tracking-tight ${metrics.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(metrics.profit)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Revenue − Expenses − Job Costs
              </p>
            </div>
          </div>

          {/* Total Expenses (Process Magenta - matching middle ink drop) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 border-t-4 border-t-magenta-500 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Expenses</span>
              <div className="p-2 rounded-xl bg-pink-50 text-magenta-600 border border-pink-200">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-magenta-600 tracking-tight">
                {formatCurrency(metrics.totalExpenses)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Studio operational overheads
              </p>
            </div>
          </div>

          {/* Invoiced Billed Total (Process Yellow / Amber - matching left ink drop) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 border-t-4 border-t-amber-400 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-600 tracking-tight">
                {formatCurrency(metrics.totalInvoicesAmount)}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Across {metrics.totalInvoicesCount} invoices
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Operational Metrics Cards (Grid of 5) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Paid Invoices */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Paid Invoices</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{metrics.paidInvoicesCount}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{formatCurrency(metrics.paidInvoicesAmount)}</div>
          </div>

          {/* Pending Invoices */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Unpaid / Pending</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{metrics.unpaidInvoicesCount}</div>
            <div className="text-[11px] text-amber-600 font-mono mt-0.5">{formatCurrency(metrics.unpaidInvoicesAmount)}</div>
          </div>

          {/* Overdue */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-rose-600 text-xs font-semibold mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue Invoices</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{metrics.overdueInvoicesCount}</div>
            <div className="text-[11px] text-rose-600 font-mono mt-0.5">{formatCurrency(metrics.overdueInvoicesAmount)}</div>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-sky-600 text-xs font-semibold mb-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Total Orders</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{metrics.totalOrdersCount}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{formatCurrency(metrics.totalOrdersAmount)}</div>
          </div>

          {/* Total Customers */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Active CRM Clients</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{metrics.totalCustomersCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">In Database</div>
          </div>
        </div>

        {/* Dynamic Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue & Expenses Trend Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Financial Cash Flow Timeline</h3>
                <p className="text-[11px] text-slate-500">Revenue collections vs. Studio expenses</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-brand-600">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  <span>Revenue</span>
                </div>
                <div className="flex items-center gap-1.5 text-magenta-600">
                  <div className="w-2.5 h-2.5 rounded-full bg-magenta-500" />
                  <span>Expenses</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              {data?.revenueChartData && data.revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00a3e0" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00a3e0" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec008c" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ec008c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(val: any) => [formatCurrency(Number(val)), '']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#00a3e0" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" name="Revenue" />
                    <Area type="monotone" dataKey="expense" stroke="#ec008c" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" name="Expense" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No financial activity recorded in this period.
                </div>
              )}
            </div>
          </div>

          {/* Invoice Status Breakdown Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Invoice Status Split</h3>
              <p className="text-[11px] text-slate-500">Distribution of billing volume</p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {data?.statusBreakdown && data.statusBreakdown.some((s: any) => s.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {data.statusBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-500 py-8">
                  No invoices created yet.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-500"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Invoice</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Invoices & Recent Orders Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Invoices</h3>
                <p className="text-[11px] text-slate-500">Latest graphic design invoices</p>
              </div>
              <Link
                href="/invoices"
                className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {data?.recentInvoices && data.recentInvoices.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="pb-2.5">Invoice #</th>
                      <th className="pb-2.5">Client</th>
                      <th className="pb-2.5 text-right">Amount</th>
                      <th className="pb-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 font-mono font-bold text-brand-600">
                          <Link href={`/invoices/${inv.id}`} className="hover:underline">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-2.5">
                          <div className="font-semibold text-slate-800">{inv.customer?.name}</div>
                          {inv.customer?.companyName && (
                            <div className="text-[10px] text-slate-500">{inv.customer.companyName}</div>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(inv.grandTotal)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : inv.status === 'OVERDUE'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No invoices found. Click "Create Invoice" to start billing.
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
                <p className="text-[11px] text-slate-500">Design projects and print orders</p>
              </div>
              <Link
                href="/orders"
                className="text-xs font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {data?.recentOrders && data.recentOrders.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="pb-2.5">Order #</th>
                      <th className="pb-2.5">Client</th>
                      <th className="pb-2.5 text-right">Total</th>
                      <th className="pb-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentOrders.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 font-mono font-bold text-slate-900">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-2.5">
                          <div className="font-semibold text-slate-800">{ord.customer?.name}</div>
                          {ord.customer?.companyName && (
                            <div className="text-[10px] text-slate-500">{ord.customer.companyName}</div>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(ord.grandTotal)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No orders recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
