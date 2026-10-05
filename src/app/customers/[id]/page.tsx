'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  ArrowLeft,
  Mail,
  Phone,
  Building,
  FileText,
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle,
  CreditCard,
  MapPin,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load customer');
      setCustomer(data.customer);
    } catch (err: any) {
      error(err.message || 'Error loading customer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  const handleConvertOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/convert`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Conversion failed');
      success(`Order converted to Invoice #${data.invoice?.invoiceNumber}`);
      fetchCustomer();
    } catch (err: any) {
      error(err.message || 'Failed to convert order');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-500">Loading customer profile...</div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-rose-400 font-bold mb-4">Customer not found</p>
          <Link href="/customers" className="px-4 py-2 bg-slate-800 rounded-xl text-xs text-white">
            Return to Customers
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Breadcrumb & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/customers"
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{customer.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    customer.status === 'ACTIVE' || customer.status === 'CLIENT'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : customer.status === 'LEAD'
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              {customer.companyName && (
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{customer.companyName}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/invoices/new?customerId=${customer.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice for Client</span>
            </Link>
          </div>
        </div>

        {/* Financial Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400">Total Billed</span>
            <div className="text-xl font-black text-white mt-1 font-mono">{formatCurrency(customer.totalBilled)}</div>
            <p className="text-[10px] text-slate-500 mt-1">{customer.totalInvoices} Invoices Issued</p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400">Total Paid</span>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono">{formatCurrency(customer.totalPaid)}</div>
            <p className="text-[10px] text-emerald-500/70 mt-1">Cleared Payments</p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400">Pending Receivables</span>
            <div className={`text-xl font-black mt-1 font-mono ${customer.pendingAmount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {formatCurrency(customer.pendingAmount)}
            </div>
            <p className="text-[10px] text-amber-500/70 mt-1">Outstanding Balance</p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400">Total Orders</span>
            <div className="text-xl font-black text-white mt-1">{customer.totalOrders}</div>
            <p className="text-[10px] text-slate-500 mt-1">Graphic Design Projects</p>
          </div>
        </div>

        {/* Customer Details Information Box */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">Contact Details</h3>
            <div className="space-y-1.5 text-slate-300">
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-brand-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.mobile && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-brand-400" />
                  <span>{customer.mobile}</span>
                </div>
              )}
              {customer.gstin && (
                <div className="font-mono text-brand-300 font-semibold mt-1">
                  GSTIN: {customer.gstin}
                </div>
              )}
              {customer.pan && (
                <div className="font-mono text-slate-400">
                  PAN: {customer.pan}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">Billing Address</h3>
            <p className="text-slate-300 whitespace-pre-line leading-relaxed">
              {customer.billingAddress || 'No billing address provided.'}
            </p>
          </div>

          <div>
            <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-2">Delivery Address & Notes</h3>
            <p className="text-slate-300 whitespace-pre-line leading-relaxed mb-2">
              {customer.shippingAddress || 'No delivery address specified.'}
            </p>
            {customer.notes && (
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 italic">
                {customer.notes}
              </div>
            )}
          </div>
        </div>

        {/* Invoices History Table */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Invoice History</h3>
              <p className="text-[11px] text-slate-400">All tax invoices generated for this client</p>
            </div>
            <Link
              href={`/invoices/new?customerId=${customer.id}`}
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              + New Invoice
            </Link>
          </div>

          <div className="overflow-x-auto">
            {customer.invoices && customer.invoices.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-2.5">Invoice #</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Due Date</th>
                    <th className="pb-2.5 text-right">Grand Total</th>
                    <th className="pb-2.5 text-right">Paid</th>
                    <th className="pb-2.5 text-right">Balance</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customer.invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 font-mono font-bold text-white">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-brand-400">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-2.5 text-slate-300">{formatDate(inv.invoiceDate)}</td>
                      <td className="py-2.5 text-slate-400">{formatDate(inv.dueDate)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-white">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-emerald-400">
                        {formatCurrency(inv.paidAmount)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-amber-400 font-semibold">
                        {formatCurrency(inv.balanceAmount)}
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
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold"
                        >
                          View / Print
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No invoices found for this customer.
              </div>
            )}
          </div>
        </div>

        {/* Orders History Table */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Order History</h3>
              <p className="text-[11px] text-slate-400">Design job orders and production status</p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              + Create Order
            </Link>
          </div>

          <div className="overflow-x-auto">
            {customer.orders && customer.orders.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-2.5">Order #</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5 text-right">Items</th>
                    <th className="pb-2.5 text-right">Grand Total</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customer.orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 font-mono font-bold text-white">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-2.5 text-slate-300">{formatDate(ord.orderDate)}</td>
                      <td className="py-2.5 text-right text-slate-400">{ord.items?.length || 0} line(s)</td>
                      <td className="py-2.5 text-right font-mono font-bold text-white">
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
                      <td className="py-2.5 text-right">
                        {ord.convertedToInvoiceId ? (
                          <Link
                            href={`/invoices/${ord.convertedToInvoiceId}`}
                            className="text-brand-400 hover:underline text-[11px] font-semibold"
                          >
                            View Invoice
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleConvertOrder(ord.id)}
                            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-[11px] font-bold transition shadow-md shadow-brand-600/20"
                          >
                            Convert to Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No orders recorded for this customer.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
