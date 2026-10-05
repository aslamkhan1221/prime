import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const search = searchParams.get('search') || '';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
        { referenceNumber: { contains: search } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalAmount = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    return NextResponse.json({ expenses, totalAmount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: 'Expense title is required' }, { status: 400 });
    }

    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        title: body.title.trim(),
        category: body.category || 'Miscellaneous Expenses',
        amount,
        date: body.date ? new Date(body.date) : new Date(),
        description: body.description?.trim() || null,
        paymentMethod: body.paymentMethod || 'BANK_TRANSFER',
        referenceNumber: body.referenceNumber?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
