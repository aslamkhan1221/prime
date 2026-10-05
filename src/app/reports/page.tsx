'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  ShoppingBag,
  FileText,
  UserCheck,
  Package,
} from 'lucide-react';

const REPORT_TABS = [
  { id: 'revenue', label: 'Revenue Report', icon: DollarSign },
  { id: 'invoice', label: 'Invoice Report', icon: FileText },
  { id: 'payment', label: 'Payment Receipts', icon: DollarSign },
  { id: 'outstanding', label: 'Outstanding Receivables', icon: TrendingUp },
  { id: 'expense', label: 'Expense Report', icon: Receipt },
  { id: 'order', label: 'Order Report', icon: ShoppingBag },
  { id: 'customer', label: 'Customer Sales', icon: Users },
  { id: 'profit', label: 'Net Profit Report', icon: TrendingUp },
  { id: 'partner_profit', label: 'Partner Profit Share', icon: UserCheck },
  { id: 'item_sales', label: 'Item & Service Sales', icon: Package },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { error, success } = useToast();

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?type=${activeTab}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;

      const res = await fetch(url);
      const reportData = await res.json();
      setData(reportData);
    } catch {
      error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportData();
  };

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    if (!data) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'revenue' && data.payments) {
      csvContent += 'Payment Number,Invoice Number,Customer,Date,Method,Reference,Amount\n';
      data.payments.forEach((p: any) => {
        csvContent += `"${p.paymentNumber}","${p.invoice?.invoiceNumber || ''}","${p.invoice?.customer?.name || ''}","${formatDate(p.paymentDate)}","${p.paymentMethod}","${p.referenceNumber || ''}","${p.amount}"\n`;
      });
    } else if (activeTab === 'invoice' && data.invoices) {
      csvContent += 'Invoice Number,Customer,Date,Due Date,Status,Subtotal,Tax Total,Grand Total,Paid,Balance\n';
      data.invoices.forEach((inv: any) => {
        csvContent += `"${inv.invoiceNumber}","${inv.customer?.name || ''}","${formatDate(inv.invoiceDate)}","${formatDate(inv.dueDate)}","${inv.status}","${inv.subtotal}","${inv.taxTotal}","${inv.grandTotal}","${inv.paidAmount}","${inv.balanceAmount}"\n`;
      });
    } else if (activeTab === 'outstanding' && data.invoices) {
      csvContent += 'Invoice Number,Customer,Phone,Invoice Date,Due Date,Grand Total,Paid,Outstanding Balance\n';
      data.invoices.forEach((inv: any) => {
        csvContent += `"${inv.invoiceNumber}","${inv.customer?.name || ''}","${inv.customer?.mobile || ''}","${formatDate(inv.invoiceDate)}","${formatDate(inv.dueDate)}","${inv.grandTotal}","${inv.paidAmount}","${inv.balanceAmount}"\n`;
      });
    } else if (activeTab === 'expense' && data.expenses) {
      csvContent += 'Title,Category,Date,Payment Method,Reference,Amount\n';
      data.expenses.forEach((e: any) => {
        csvContent += `"${e.title}","${e.category}","${formatDate(e.date)}","${e.paymentMethod}","${e.referenceNumber || ''}","${e.amount}"\n`;
      });
    } else if (activeTab === 'customer' && data.customers) {
      csvContent += 'Customer Name,Company,Phone,Email,Status,Orders,Invoices,Total Billed,Total Paid,Pending Balance\n';
      data.customers.forEach((c: any) => {
        csvContent += `"${c.name}","${c.companyName || ''}","${c.mobile || ''}","${c.email || ''}","${c.status}","${c.ordersCount}","${c.invoicesCount}","${c.totalBilled}","${c.totalPaid}","${c.pendingBalance}"\n`;
      });
    } else if (activeTab === 'item_sales' && data.items) {
      csvContent += 'Item Name,Category,Times Sold,Total Quantity,Total Revenue\n';
      data.items.forEach((it: any) => {
        csvContent += `"${it.name}","${it.category}","${it.count}","${it.totalQuantity}","${it.totalSales}"\n`;
      });
    } else if (activeTab === 'partner_profit' && data.partners) {
      csvContent += 'Partner Name,Profit Percentage,Net Profit Share Amount\n';
      data.partners.forEach((p: any) => {
        csvContent += `"${p.name}","${p.profitPercentage}%","${p.shareAmount}"\n`;
      });
    } else {
      csvContent += 'Key,Value\n';
      Object.entries(data).forEach(([k, v]) => {
        if (typeof v !== 'object') csvContent += `"${k}","${v}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Report exported to CSV');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Financial Reports & Business Analytics"
          subtitle="Generate audit-ready reports, tax summaries, sales volumes, and partner distributions"
        />

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 no-print">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter & Export Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 no-print">
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              <span>From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Filter
            </button>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </form>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Dynamic Report Content Body */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-500">Generating report...</div>
          ) : data ? (
            <div>
              {/* 1. Revenue Report */}
              {activeTab === 'revenue' && (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 flex justify-between items-center">
                    <span className="text-sm font-semibold text-emerald-300">Total Cleared Revenue</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {formatCurrency(data.totalRevenue)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-3">Receipt #</th>
                          <th className="pb-3">Invoice #</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Payment Method</th>
                          <th className="pb-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data.payments?.map((p: any) => (
                          <tr key={p.id}>
                            <td className="py-2.5 font-mono text-white">{p.paymentNumber}</td>
                            <td className="py-2.5 font-mono text-brand-400">{p.invoice?.invoiceNumber}</td>
                            <td className="py-2.5 text-slate-200">{p.invoice?.customer?.name}</td>
                            <td className="py-2.5 text-slate-400">{formatDate(p.paymentDate)}</td>
                            <td className="py-2.5 text-slate-300 font-medium">{p.paymentMethod}</td>
                            <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                              {formatCurrency(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Invoice Report */}
              {activeTab === 'invoice' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
                      <span className="text-xs text-slate-400">Total Billed</span>
                      <div className="text-xl font-black text-white font-mono mt-1">
                        {formatCurrency(data.totalBilled)}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
                      <span className="text-xs text-slate-400">Total Paid</span>
                      <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                        {formatCurrency(data.totalPaid)}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800">
                      <span className="text-xs text-slate-400">Total Balance Due</span>
                      <div className="text-xl font-black text-amber-400 font-mono mt-1">
                        {formatCurrency(data.totalBalance)}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-3">Invoice #</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right">Grand Total</th>
                          <th className="pb-3 text-right">Paid</th>
                          <th className="pb-3 text-right">Balance</th>
                          <th className="pb-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data.invoices?.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="py-2.5 font-mono text-white">{inv.invoiceNumber}</td>
                            <td className="py-2.5 text-slate-200">{inv.customer?.name}</td>
                            <td className="py-2.5 text-slate-400">{formatDate(inv.invoiceDate)}</td>
                            <td className="py-2.5 text-right font-mono text-white font-bold">{formatCurrency(inv.grandTotal)}</td>
                            <td className="py-2.5 text-right font-mono text-emerald-400">{formatCurrency(inv.paidAmount)}</td>
                            <td className="py-2.5 text-right font-mono text-amber-400 font-semibold">{formatCurrency(inv.balanceAmount)}</td>
                            <td className="py-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Outstanding Receivables */}
              {activeTab === 'outstanding' && (
                <div className="space-y-6">
                  <div className="p-4 bg-amber-950/40 rounded-2xl border border-amber-500/30 flex justify-between items-center">
                    <span className="text-sm font-semibold text-amber-300">
                      Total Outstanding Receivables ({data.count} Pending Invoices)
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {formatCurrency(data.totalOutstanding)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-3">Invoice #</th>
                          <th className="pb-3">Client</th>
                          <th className="pb-3">Phone</th>
                          <th className="pb-3">Due Date</th>
                          <th className="pb-3 text-right">Invoice Total</th>
                          <th className="pb-3 text-right">Paid So Far</th>
                          <th className="pb-3 text-right">Outstanding Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data.invoices?.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="py-2.5 font-mono text-white">{inv.invoiceNumber}</td>
                            <td className="py-2.5 text-slate-200">{inv.customer?.name}</td>
                            <td className="py-2.5 text-slate-400">{inv.customer?.mobile || '-'}</td>
                            <td className="py-2.5 text-slate-400">{formatDate(inv.dueDate)}</td>
                            <td className="py-2.5 text-right font-mono text-slate-300">{formatCurrency(inv.grandTotal)}</td>
                            <td className="py-2.5 text-right font-mono text-emerald-400">{formatCurrency(inv.paidAmount)}</td>
                            <td className="py-2.5 text-right font-mono font-bold text-amber-400">
                              {formatCurrency(inv.balanceAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. Expense Report */}
              {activeTab === 'expense' && (
                <div className="space-y-6">
                  <div className="p-4 bg-rose-950/40 rounded-2xl border border-rose-500/30 flex justify-between items-center">
                    <span className="text-sm font-semibold text-rose-300">Total Studio Expenses</span>
                    <span className="text-2xl font-black text-rose-400 font-mono">
                      {formatCurrency(data.totalExpenses)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-3">Title</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Method</th>
                          <th className="pb-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data.expenses?.map((e: any) => (
                          <tr key={e.id}>
                            <td className="py-2.5 font-semibold text-white">{e.title}</td>
                            <td className="py-2.5 text-slate-300">{e.category}</td>
                            <td className="py-2.5 text-slate-400">{formatDate(e.date)}</td>
                            <td className="py-2.5 text-slate-300">{e.paymentMethod}</td>
                            <td className="py-2.5 text-right font-mono font-bold text-rose-400">
                              {formatCurrency(e.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. Customer Report */}
              {activeTab === 'customer' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Customer</th>
                        <th className="pb-3">Company</th>
                        <th className="pb-3 text-center">Orders</th>
                        <th className="pb-3 text-center">Invoices</th>
                        <th className="pb-3 text-right">Total Billed</th>
                        <th className="pb-3 text-right">Total Paid</th>
                        <th className="pb-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.customers?.map((c: any) => (
                        <tr key={c.id}>
                          <td className="py-2.5 font-bold text-white">{c.name}</td>
                          <td className="py-2.5 text-slate-400">{c.companyName || '-'}</td>
                          <td className="py-2.5 text-center text-slate-300">{c.ordersCount}</td>
                          <td className="py-2.5 text-center text-slate-300">{c.invoicesCount}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-white">{formatCurrency(c.totalBilled)}</td>
                          <td className="py-2.5 text-right font-mono text-emerald-400">{formatCurrency(c.totalPaid)}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-amber-400">{formatCurrency(c.pendingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 6. Net Profit Report */}
              {activeTab === 'profit' && (
                <div className="space-y-6 max-w-xl mx-auto">
                  <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between text-slate-300 text-sm">
                      <span>Total Revenue (Paid Income):</span>
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(data.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-sm">
                      <span>Less: Studio Expenses:</span>
                      <span className="font-mono text-rose-400">-{formatCurrency(data.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-sm">
                      <span>Less: Direct Product / Media Job Costs:</span>
                      <span className="font-mono text-slate-400">-{formatCurrency(data.jobCosts)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-white pt-3 border-t border-slate-800">
                      <span>Net Distributable Profit:</span>
                      <span className="font-mono text-emerald-400 text-xl">{formatCurrency(data.netProfit)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. Partner Profit Share Report */}
              {activeTab === 'partner_profit' && (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 flex justify-between items-center">
                    <span className="text-sm font-semibold text-emerald-300">Total Net Distributable Profit</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {formatCurrency(data.netProfit)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-3">Partner Name</th>
                          <th className="pb-3 text-center">Profit Sharing %</th>
                          <th className="pb-3 text-right">Calculated Profit Share (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data.partners?.map((p: any) => (
                          <tr key={p.id}>
                            <td className="py-2.5 font-bold text-white text-sm">{p.name}</td>
                            <td className="py-2.5 text-center font-mono font-bold text-brand-400">{p.profitPercentage}%</td>
                            <td className="py-2.5 text-right font-mono font-black text-emerald-400 text-base">
                              {formatCurrency(p.shareAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 8. Item & Service Sales */}
              {activeTab === 'item_sales' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-3">Design Service / Item Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3 text-center">Times Invoiced</th>
                        <th className="pb-3 text-right">Total Quantity / Area</th>
                        <th className="pb-3 text-right">Total Revenue (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.items?.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 font-bold text-white">{it.name}</td>
                          <td className="py-2.5 text-slate-400">{it.category}</td>
                          <td className="py-2.5 text-center text-slate-300">{it.count}</td>
                          <td className="py-2.5 text-right font-mono text-slate-300">{it.totalQuantity}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                            {formatCurrency(it.totalSales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">No data available for this report.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
