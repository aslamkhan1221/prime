'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Header } from '@/components/Header';
import { useToast } from '@/components/Toast';
import {
  FileCheck2,
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { error } = useToast();

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/purchases/orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch {
      error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const term = search.toLowerCase();
    return (
      o.poNumber?.toLowerCase().includes(term) ||
      o.vendorName?.toLowerCase().includes(term) ||
      o.referenceNumber?.toLowerCase().includes(term)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Header
          title="Purchase Orders"
          actionText="New Purchase Order"
          actionIcon={<Plus className="w-4 h-4" />}
          actionHref="/purchases/orders/new"
        />

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by PO#, Vendor, Reference..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total Purchase Orders: <span className="font-bold text-slate-800">{filtered.length}</span>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">PO Number</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Order Date</th>
                  <th className="py-3.5 px-4">Delivery Date</th>
                  <th className="py-3.5 px-4">Reference#</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-800">No purchase orders found</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Issue purchase orders to suppliers for flex rolls, vinyl sheets, acrylic, and offset supplies.
                      </p>
                      <Link
                        href="/purchases/orders/new"
                        className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-500 shadow-md shadow-brand-500/20 transition"
                      >
                        + Create Purchase Order
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filtered.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">
                        {po.poNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {po.vendorName || 'Vendor'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(po.orderDate)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {po.deliveryDate ? formatDate(po.deliveryDate) : '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {po.referenceNumber || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            po.status === 'ISSUED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : po.status === 'BILLED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {po.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(po.total || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
