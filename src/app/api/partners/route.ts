import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { calculatePartnerProfits, validatePartnerPercentages } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    // Check which partners have active user login accounts
    const partnerEmails = partners.map((p) => p.email).filter(Boolean) as string[];
    const userAccounts = await prisma.user.findMany({
      where: { email: { in: partnerEmails } },
      select: { email: true, role: true, createdAt: true },
    });
    const userEmailMap = new Set(userAccounts.map((u) => u.email));

    const enrichedPartners = partners.map((p) => {
      let parsedPermissions = ['dashboard', 'orders', 'invoices', 'reports'];
      if (p.permissions) {
        try {
          parsedPermissions = JSON.parse(p.permissions);
        } catch {
          // fallback
        }
      }
      return {
        ...p,
        hasLoginAccount: p.email ? userEmailMap.has(p.email) : false,
        parsedPermissions,
        assignedOrdersCount: p._count?.orders || 0,
      };
    });

    // Date filters for financial figures
    const paymentWhere: any = {};
    const expenseWhere: any = {};

    if (fromDate || toDate) {
      paymentWhere.paymentDate = {};
      expenseWhere.date = {};
      if (fromDate) {
        paymentWhere.paymentDate.gte = new Date(fromDate);
        expenseWhere.date.gte = new Date(fromDate);
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        paymentWhere.paymentDate.lte = to;
        expenseWhere.date.lte = to;
      }
    }

    // Dynamic calculations from actual DB
    const payments = await prisma.payment.findMany({ where: paymentWhere });
    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    const expenses = await prisma.expense.findMany({ where: expenseWhere });
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    const invoiceItems = await prisma.invoiceItem.findMany({
      where:
        fromDate || toDate
          ? {
              invoice: {
                invoiceDate: {
                  gte: fromDate ? new Date(fromDate) : undefined,
                  lte: toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : undefined,
                },
              },
            }
          : undefined,
      include: { item: true },
    });

    const totalJobCost = invoiceItems.reduce((acc, ii) => {
      const itemCost = ii.item?.costPrice || 0;
      return acc + itemCost * (ii.quantity || 1);
    }, 0);

    const netProfit = Math.max(0, totalRevenue - totalExpenses - totalJobCost);

    const partnerDistributions = calculatePartnerProfits(netProfit, enrichedPartners);
    const validation = validatePartnerPercentages(enrichedPartners);

    return NextResponse.json({
      partners: partnerDistributions,
      rawPartners: enrichedPartners,
      financials: {
        totalRevenue,
        totalExpenses,
        totalJobCost,
        totalCosts: totalExpenses + totalJobCost,
        netProfit,
      },
      validation,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Partner name is required' }, { status: 400 });
    }

    if (!body.email || !body.email.trim()) {
      return NextResponse.json({ error: 'Partner email is required to create login credentials' }, { status: 400 });
    }

    const percentage = Number(body.profitPercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      return NextResponse.json({ error: 'Profit percentage must be between 0.01% and 100%' }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    const plainPassword = body.password?.trim() || `Prime@${Math.floor(1000 + Math.random() * 9000)}`;
    const permissionsArray = Array.isArray(body.permissions)
      ? body.permissions
      : ['dashboard', 'orders', 'invoices', 'reports'];
    const permissionsJson = JSON.stringify(permissionsArray);

    const partner = await prisma.partner.create({
      data: {
        name: body.name.trim(),
        email: email,
        phone: body.phone?.trim() || null,
        profitPercentage: percentage,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        notes: body.notes?.trim() || null,
        passwordHint: plainPassword,
        permissions: permissionsJson,
      },
    });

    // Generate / update User login credential in database
    const passwordHash = await hashPassword(plainPassword);
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: {
          name: body.name.trim(),
          passwordHash,
          role: 'PARTNER',
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name: body.name.trim(),
          email,
          passwordHash,
          role: 'PARTNER',
        },
      });
    }

    return NextResponse.json({
      success: true,
      partner,
      credentials: {
        name: partner.name,
        email,
        password: plainPassword,
        role: 'PARTNER',
        permissions: permissionsArray,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
