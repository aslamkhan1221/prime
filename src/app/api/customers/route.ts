import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { gstin: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            invoices: true,
            orders: true,
          },
        },
        invoices: {
          select: {
            grandTotal: true,
            paidAmount: true,
            balanceAmount: true,
            status: true,
          },
        },
      },
    });

    const transformed = customers.map((c) => {
      const totalBilled = c.invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
      const totalPaid = c.invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
      const pendingAmount = c.invoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

      return {
        id: c.id,
        name: c.name,
        companyName: c.companyName,
        mobile: c.mobile,
        email: c.email,
        gstin: c.gstin,
        pan: c.pan,
        billingAddress: c.billingAddress,
        shippingAddress: c.shippingAddress,
        notes: c.notes,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        totalOrders: c._count.orders,
        totalInvoices: c._count.invoices,
        totalBilled,
        totalPaid,
        pendingAmount,
      };
    });

    return NextResponse.json({ customers: transformed });
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
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: body.name.trim(),
        companyName: body.companyName?.trim() || null,
        mobile: body.mobile?.trim() || null,
        email: body.email?.trim() || null,
        gstin: body.gstin?.trim()?.toUpperCase() || null,
        pan: body.pan?.trim()?.toUpperCase() || null,
        billingAddress: body.billingAddress?.trim() || null,
        shippingAddress: body.shippingAddress?.trim() || null,
        notes: body.notes?.trim() || null,
        status: body.status || 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
