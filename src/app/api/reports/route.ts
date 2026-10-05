import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculatePartnerProfits } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'revenue';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const dateFilterInvoice: any = {};
    const dateFilterPayment: any = {};
    const dateFilterExpense: any = {};
    const dateFilterOrder: any = {};

    if (fromDate || toDate) {
      if (fromDate) {
        const start = new Date(fromDate);
        dateFilterInvoice.invoiceDate = { ...dateFilterInvoice.invoiceDate, gte: start };
        dateFilterPayment.paymentDate = { ...dateFilterPayment.paymentDate, gte: start };
        dateFilterExpense.date = { ...dateFilterExpense.date, gte: start };
        dateFilterOrder.orderDate = { ...dateFilterOrder.orderDate, gte: start };
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        dateFilterInvoice.invoiceDate = { ...dateFilterInvoice.invoiceDate, lte: end };
        dateFilterPayment.paymentDate = { ...dateFilterPayment.paymentDate, lte: end };
        dateFilterExpense.date = { ...dateFilterExpense.date, lte: end };
        dateFilterOrder.orderDate = { ...dateFilterOrder.orderDate, lte: end };
      }
    }

    switch (type) {
      case 'revenue': {
        const payments = await prisma.payment.findMany({
          where: dateFilterPayment,
          include: {
            invoice: {
              include: { customer: true },
            },
          },
          orderBy: { paymentDate: 'desc' },
        });

        const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

        // Group by payment method
        const methodBreakdown = payments.reduce((acc: any, p) => {
          acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
          return acc;
        }, {});

        return NextResponse.json({
          reportType: 'revenue',
          totalRevenue,
          payments,
          methodBreakdown,
        });
      }

      case 'invoice': {
        const invoices = await prisma.invoice.findMany({
          where: dateFilterInvoice,
          include: { customer: true, payments: true },
          orderBy: { invoiceDate: 'desc' },
        });

        const totalBilled = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
        const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
        const totalBalance = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);

        const statusCounts = invoices.reduce((acc: any, inv) => {
          acc[inv.status] = (acc[inv.status] || 0) + 1;
          return acc;
        }, {});

        return NextResponse.json({
          reportType: 'invoice',
          totalInvoices: invoices.length,
          totalBilled,
          totalPaid,
          totalBalance,
          statusCounts,
          invoices,
        });
      }

      case 'payment': {
        const payments = await prisma.payment.findMany({
          where: dateFilterPayment,
          include: {
            invoice: {
              include: { customer: true },
            },
          },
          orderBy: { paymentDate: 'desc' },
        });
        const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
        return NextResponse.json({ reportType: 'payment', totalAmount, payments });
      }

      case 'outstanding': {
        const invoices = await prisma.invoice.findMany({
          where: {
            balanceAmount: { gt: 0 },
            status: { not: 'CANCELLED' },
            ...dateFilterInvoice,
          },
          include: { customer: true },
          orderBy: { dueDate: 'asc' },
        });

        const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);

        return NextResponse.json({
          reportType: 'outstanding',
          totalOutstanding,
          count: invoices.length,
          invoices,
        });
      }

      case 'expense': {
        const expenses = await prisma.expense.findMany({
          where: dateFilterExpense,
          orderBy: { date: 'desc' },
        });

        const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
        const categoryBreakdown = expenses.reduce((acc: any, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {});

        return NextResponse.json({
          reportType: 'expense',
          totalExpenses,
          categoryBreakdown,
          expenses,
        });
      }

      case 'order': {
        const orders = await prisma.order.findMany({
          where: dateFilterOrder,
          include: { customer: true, items: true },
          orderBy: { orderDate: 'desc' },
        });

        const totalOrdersAmount = orders.reduce((acc, o) => acc + o.grandTotal, 0);
        const statusBreakdown = orders.reduce((acc: any, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {});

        return NextResponse.json({
          reportType: 'order',
          totalOrders: orders.length,
          totalOrdersAmount,
          statusBreakdown,
          orders,
        });
      }

      case 'customer': {
        const customers = await prisma.customer.findMany({
          include: {
            invoices: true,
            orders: true,
          },
          orderBy: { name: 'asc' },
        });

        const customerStats = customers.map((c) => {
          const totalBilled = c.invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
          const totalPaid = c.invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
          const pendingBalance = c.invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);

          return {
            id: c.id,
            name: c.name,
            companyName: c.companyName,
            mobile: c.mobile,
            email: c.email,
            status: c.status,
            ordersCount: c.orders.length,
            invoicesCount: c.invoices.length,
            totalBilled,
            totalPaid,
            pendingBalance,
          };
        });

        customerStats.sort((a, b) => b.totalBilled - a.totalBilled);

        return NextResponse.json({
          reportType: 'customer',
          totalCustomers: customers.length,
          customers: customerStats,
        });
      }

      case 'profit': {
        const payments = await prisma.payment.findMany({ where: dateFilterPayment });
        const revenue = payments.reduce((acc, p) => acc + p.amount, 0);

        const expenses = await prisma.expense.findMany({ where: dateFilterExpense });
        const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

        const invoiceItems = await prisma.invoiceItem.findMany({
          where: dateFilterInvoice.invoiceDate ? { invoice: dateFilterInvoice } : undefined,
          include: { item: true },
        });

        const jobCosts = invoiceItems.reduce((acc, ii) => {
          const cPrice = ii.item?.costPrice || 0;
          return acc + cPrice * (ii.quantity || 1);
        }, 0);

        const netProfit = revenue - totalExpenses - jobCosts;

        return NextResponse.json({
          reportType: 'profit',
          revenue,
          totalExpenses,
          jobCosts,
          totalCosts: totalExpenses + jobCosts,
          netProfit,
        });
      }

      case 'partner_profit': {
        const payments = await prisma.payment.findMany({ where: dateFilterPayment });
        const revenue = payments.reduce((acc, p) => acc + p.amount, 0);

        const expenses = await prisma.expense.findMany({ where: dateFilterExpense });
        const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

        const invoiceItems = await prisma.invoiceItem.findMany({
          where: dateFilterInvoice.invoiceDate ? { invoice: dateFilterInvoice } : undefined,
          include: { item: true },
        });

        const jobCosts = invoiceItems.reduce((acc, ii) => {
          const cPrice = ii.item?.costPrice || 0;
          return acc + cPrice * (ii.quantity || 1);
        }, 0);

        const netProfit = Math.max(0, revenue - totalExpenses - jobCosts);
        const partners = await prisma.partner.findMany({ where: { isActive: true } });
        const partnerProfits = calculatePartnerProfits(netProfit, partners);

        return NextResponse.json({
          reportType: 'partner_profit',
          revenue,
          totalExpenses,
          jobCosts,
          netProfit,
          partners: partnerProfits,
        });
      }

      case 'item_sales': {
        const invoiceItems = await prisma.invoiceItem.findMany({
          where: dateFilterInvoice.invoiceDate ? { invoice: dateFilterInvoice } : undefined,
          include: { item: true, invoice: true },
        });

        const itemMap: { [key: string]: { name: string; category: string; count: number; totalQuantity: number; totalSales: number } } = {};

        for (const ii of invoiceItems) {
          const key = ii.name;
          if (!itemMap[key]) {
            itemMap[key] = {
              name: ii.name,
              category: ii.item?.category || 'Custom Design',
              count: 0,
              totalQuantity: 0,
              totalSales: 0,
            };
          }
          itemMap[key].count += 1;
          itemMap[key].totalQuantity += ii.quantity || 1;
          itemMap[key].totalSales += ii.totalAmount || 0;
        }

        const items = Object.values(itemMap).sort((a, b) => b.totalSales - a.totalSales);

        return NextResponse.json({
          reportType: 'item_sales',
          items,
          totalSales: items.reduce((acc, it) => acc + it.totalSales, 0),
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Reports error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
