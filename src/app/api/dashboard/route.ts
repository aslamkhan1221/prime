import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'this_month';
    const customFrom = searchParams.get('fromDate');
    const customTo = searchParams.get('toDate');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'this_week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
        startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
        break;
      }
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case 'custom':
        startDate = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
        if (customTo) {
          endDate = new Date(customTo);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case 'this_month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
    }

    const dateFilterInvoice = {
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    const dateFilterPayment = {
      paymentDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    const dateFilterExpense = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    const dateFilterOrder: any = {
      orderDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    // If partner, filter orders by assigned partner
    if (user.role === 'PARTNER' && user.partnerId) {
      dateFilterOrder.assignedPartnerId = user.partnerId;
    }

    // 1. Invoices
    const invoices = await prisma.invoice.findMany({
      where: dateFilterInvoice,
      include: { customer: true, payments: true, items: { include: { item: true } } },
      orderBy: { invoiceDate: 'desc' },
    });

    const totalInvoicesCount = invoices.length;
    const totalInvoicesAmount = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

    const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');
    const paidInvoicesCount = paidInvoices.length;
    const paidInvoicesAmount = paidInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

    const unpaidInvoices = invoices.filter(
      (inv) => inv.status === 'DRAFT' || inv.status === 'SENT' || inv.status === 'PARTIALLY_PAID'
    );
    const unpaidInvoicesCount = unpaidInvoices.length;
    const unpaidInvoicesAmount = unpaidInvoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);

    const overdueInvoices = invoices.filter((inv) => {
      return (
        inv.status === 'OVERDUE' ||
        (inv.dueDate < now && inv.balanceAmount > 0 && inv.status !== 'CANCELLED')
      );
    });
    const overdueInvoicesCount = overdueInvoices.length;
    const overdueInvoicesAmount = overdueInvoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);

    // 2. Payments (Actual Cash Inflow / Revenue in the period)
    const payments = await prisma.payment.findMany({
      where: dateFilterPayment,
    });
    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    // 3. Expenses
    const expenses = await prisma.expense.findMany({
      where: dateFilterExpense,
    });
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // 4. Job/Item Costs for net profit calculation
    const totalJobCost = invoices.reduce((acc, inv) => {
      const invItemsCost = inv.items.reduce((iAcc, ii) => {
        const cPrice = ii.item?.costPrice || 0;
        return iAcc + cPrice * (ii.quantity || 1);
      }, 0);
      return acc + invItemsCost;
    }, 0);

    // Profit calculation: Revenue (received) - Expenses - Item Cost
    const netProfit = totalRevenue - totalExpenses - totalJobCost;

    // 5. Orders
    const orders = await prisma.order.findMany({
      where: dateFilterOrder,
      include: { customer: true },
      orderBy: { orderDate: 'desc' },
    });
    const totalOrdersCount = orders.length;
    const totalOrdersAmount = orders.reduce((acc, o) => acc + o.grandTotal, 0);

    // 6. Customers
    const totalCustomersCount = await prisma.customer.count();

    // 7. Recent Invoices (latest 6 overall)
    const recentInvoices = await prisma.invoice.findMany({
      take: 6,
      orderBy: { invoiceDate: 'desc' },
      include: { customer: true },
    });

    // 8. Recent Orders (respects partner filtering)
    const recentOrders = await prisma.order.findMany({
      where: user.role === 'PARTNER' && user.partnerId ? { assignedPartnerId: user.partnerId } : undefined,
      take: 6,
      orderBy: { orderDate: 'desc' },
      include: { customer: true },
    });

    // 9. Revenue & Expense Chart Data
    const chartMap: { [key: string]: { label: string; revenue: number; expense: number; invoiceAmount: number } } =
      {};

    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 31) {
      const curr = new Date(startDate);
      while (curr <= endDate) {
        const key = curr.toISOString().split('T')[0];
        const label = curr.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        chartMap[key] = { label, revenue: 0, expense: 0, invoiceAmount: 0 };
        curr.setDate(curr.getDate() + 1);
      }

      payments.forEach((p) => {
        const key = p.paymentDate.toISOString().split('T')[0];
        if (chartMap[key]) chartMap[key].revenue += p.amount;
      });

      expenses.forEach((e) => {
        const key = e.date.toISOString().split('T')[0];
        if (chartMap[key]) chartMap[key].expense += e.amount;
      });

      invoices.forEach((inv) => {
        const key = inv.invoiceDate.toISOString().split('T')[0];
        if (chartMap[key]) chartMap[key].invoiceAmount += inv.grandTotal;
      });
    } else {
      const curr = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (curr <= endDate) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        const label = curr.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        chartMap[key] = { label, revenue: 0, expense: 0, invoiceAmount: 0 };
        curr.setMonth(curr.getMonth() + 1);
      }

      payments.forEach((p) => {
        const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
        if (chartMap[key]) chartMap[key].revenue += p.amount;
      });

      expenses.forEach((e) => {
        const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
        if (chartMap[key]) chartMap[key].expense += e.amount;
      });

      invoices.forEach((inv) => {
        const key = `${inv.invoiceDate.getFullYear()}-${String(inv.invoiceDate.getMonth() + 1).padStart(2, '0')}`;
        if (chartMap[key]) chartMap[key].invoiceAmount += inv.grandTotal;
      });
    }

    const revenueChartData = Object.values(chartMap);

    const statusBreakdown = [
      { name: 'Paid', value: paidInvoicesCount, color: '#10b981' },
      {
        name: 'Pending / Partial',
        value:
          unpaidInvoicesCount - overdueInvoicesCount > 0 ? unpaidInvoicesCount - overdueInvoicesCount : 0,
        color: '#f59e0b',
      },
      { name: 'Overdue', value: overdueInvoicesCount, color: '#ef4444' },
      { name: 'Draft', value: invoices.filter((i) => i.status === 'DRAFT').length, color: '#6b7280' },
    ];

    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalInvoicesCount,
        totalInvoicesAmount,
        paidInvoicesCount,
        paidInvoicesAmount,
        unpaidInvoicesCount,
        unpaidInvoicesAmount,
        overdueInvoicesCount,
        overdueInvoicesAmount,
        totalOrdersCount,
        totalOrdersAmount,
        totalCustomersCount,
        totalExpenses,
        totalJobCost,
        profit: netProfit,
      },
      recentInvoices,
      recentOrders,
      revenueChartData,
      statusBreakdown,
      filter,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Dashboard error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
