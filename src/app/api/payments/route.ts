import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const invoiceId = searchParams.get('invoiceId') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { referenceNumber: { contains: search } },
        { invoice: { invoiceNumber: { contains: search } } },
        { invoice: { customer: { name: { contains: search } } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            paidAmount: true,
            balanceAmount: true,
            status: true,
            customer: {
              select: { id: true, name: true, companyName: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than 0' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Auto-generate payment receipt number
    const count = await prisma.payment.count();
    const paymentNumber = `PAY-${1001 + count}`;

    const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date();

    // Calculate new paid amount and balance
    const existingPaid = invoice.payments.reduce((acc, p) => acc + p.amount, 0);
    const newPaidAmount = existingPaid + amount;
    const newBalanceAmount = Math.max(0, invoice.grandTotal - newPaidAmount);

    let newStatus = invoice.status;
    if (newBalanceAmount <= 0) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    // Transaction to create payment and update invoice
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          paymentNumber,
          invoiceId: body.invoiceId,
          amount,
          paymentDate,
          paymentMethod: body.paymentMethod || 'UPI',
          referenceNumber: body.referenceNumber?.trim() || null,
          notes: body.notes?.trim() || null,
        },
      }),
      prisma.invoice.update({
        where: { id: body.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
        },
      }),
    ]);

    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
