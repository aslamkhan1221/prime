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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let url = `/api/dashboard?filter=${filter}`;
      if (filter === 'custom' && customFrom && customTo) {
        url += `&fromDate=${customFrom}&toDate=${customTo}`;
      }
      const res = await fetch(url);
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filter]);

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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Studio Dashboard</h1>
            <p className="text-xs text-slate-400 mt-0.5">Real-time financial performance and business metrics</p>
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
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={fetchDashboardData}
              title="Refresh Data"
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker bar */}
        {filter === 'custom' && (
          <form onSubmit={handleCustomApply} className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span>From:</span>
              <input
                type="date"
                required
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>To:</span>
              <input
                type="date"
                required
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition"
            >
              Apply Filter
            </button>
          </form>
        )}

        {/* Primary Financial Metric Cards (Grid of 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-gradient-to-br from-brand-950/40 via-slate-900 to-slate-900/90 p-5 rounded-2xl border border-brand-500/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white tracking-tight">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Actual Received Inflow
              </p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900/90 p-5 rounded-2xl border border-emerald-500/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className={`text-2xl font-black tracking-tight ${metrics.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(metrics.profit)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Revenue − Expenses − Job Costs
              </p>
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900/90 p-5 rounded-2xl border border-rose-500/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-rose-400 tracking-tight">
                {formatCurrency(metrics.totalExpenses)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Studio operational overheads
              </p>
            </div>
          </div>

          {/* Invoiced Billed Total */}
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900/90 p-5 rounded-2xl border border-purple-500/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Billed</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white tracking-tight">
                {formatCurrency(metrics.totalInvoicesAmount)}
              </div>
              <p className="text-[11px] text-purple-300 mt-1 font-medium">
                Across {metrics.totalInvoicesCount} invoices
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Operational Metrics Cards (Grid of 5) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Paid Invoices */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Paid Invoices</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.paidInvoicesCount}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{formatCurrency(metrics.paidInvoicesAmount)}</div>
          </div>

          {/* Pending Invoices */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Unpaid / Pending</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.unpaidInvoicesCount}</div>
            <div className="text-[11px] text-amber-400 font-mono mt-0.5">{formatCurrency(metrics.unpaidInvoicesAmount)}</div>
          </div>

          {/* Overdue */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Overdue Invoices</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.overdueInvoicesCount}</div>
            <div className="text-[11px] text-rose-400 font-mono mt-0.5">{formatCurrency(metrics.overdueInvoicesAmount)}</div>
          </div>

          {/* Total Orders */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Total Orders</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.totalOrdersCount}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{formatCurrency(metrics.totalOrdersAmount)}</div>
          </div>

          {/* Total Customers */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Active CRM Clients</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.totalCustomersCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">In Database</div>
          </div>
        </div>

        {/* Dynamic Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue & Expenses Trend Chart */}
          <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Financial Cash Flow Timeline</h3>
                <p className="text-[11px] text-slate-400">Revenue collections vs. Studio expenses</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-brand-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                  <span>Revenue</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
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
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      formatter={(val: any) => [formatCurrency(Number(val)), '']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" name="Revenue" />
                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" name="Expense" />
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
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Invoice Status Split</h3>
              <p className="text-[11px] text-slate-400">Distribution of billing volume</p>
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
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
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

            <div className="pt-2 border-t border-slate-800 text-center">
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-400 hover:text-brand-300"
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
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Invoices</h3>
                <p className="text-[11px] text-slate-400">Latest graphic design invoices</p>
              </div>
              <Link
                href="/invoices"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {data?.recentInvoices && data.recentInvoices.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-2.5">Invoice #</th>
                      <th className="pb-2.5">Client</th>
                      <th className="pb-2.5 text-right">Amount</th>
                      <th className="pb-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.recentInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 font-mono font-bold text-white">
                          <Link href={`/invoices/${inv.id}`} className="hover:text-brand-400">
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-2.5">
                          <div className="font-medium text-slate-200">{inv.customer?.name}</div>
                          {inv.customer?.companyName && (
                            <div className="text-[10px] text-slate-500">{inv.customer.companyName}</div>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-white">
                          {formatCurrency(inv.grandTotal)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : inv.status === 'OVERDUE'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-800 text-slate-300'
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
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Orders</h3>
                <p className="text-[11px] text-slate-400">Design projects and print orders</p>
              </div>
              <Link
                href="/orders"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {data?.recentOrders && data.recentOrders.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-2.5">Order #</th>
                      <th className="pb-2.5">Client</th>
                      <th className="pb-2.5 text-right">Total</th>
                      <th className="pb-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.recentOrders.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 font-mono font-bold text-white">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-2.5">
                          <div className="font-medium text-slate-200">{ord.customer?.name}</div>
                          {ord.customer?.companyName && (
                            <div className="text-[10px] text-slate-500">{ord.customer.companyName}</div>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-white">
                          {formatCurrency(ord.grandTotal)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : ord.status === 'IN_PROGRESS'
                                ? 'bg-sky-500/10 text-sky-400'
                                : ord.status === 'CONFIRMED'
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : ord.status === 'CANCELLED'
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-amber-500/10 text-amber-400'
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
