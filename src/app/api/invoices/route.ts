import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateLineItem, calculateDocumentTotals } from '@/lib/calculations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customerId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { companyName: { contains: search } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: { id: true, name: true, companyName: true, mobile: true, email: true, gstin: true },
        },
        items: true,
        payments: true,
      },
    });

    return NextResponse.json({ invoices });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
    }

    // Generate Invoice Number if not provided
    let invoiceNumber = body.invoiceNumber;
    if (!invoiceNumber) {
      const settings = await prisma.companySetting.findUnique({ where: { id: 'default' } });
      const prefix = settings?.invoicePrefix || 'INV-';
      const invCount = await prisma.invoice.count();
      const startNum = settings?.invoiceNumberStart || 1001;
      invoiceNumber = `${prefix}${startNum + invCount}`;
    }

    // Calculate items server side
    const calculatedItems = body.items.map((item: any) => {
      const calc = calculateLineItem({
        pricingType: item.pricingType || 'QTY_RATE',
        unit: item.unit || 'PIECE',
        width: item.width ? Number(item.width) : null,
        height: item.height ? Number(item.height) : null,
        quantity: item.quantity ? Number(item.quantity) : 1,
        area: item.area ? Number(item.area) : null,
        rate: Number(item.rate) || 0,
        discount: Number(item.discount) || 0,
        taxRate: Number(item.taxRate) ?? 18.0,
      });

      return {
        itemId: item.itemId || null,
        name: item.name || 'Custom Design Item',
        description: item.description || null,
        unit: item.unit || 'PIECE',
        pricingType: item.pricingType || 'QTY_RATE',
        width: item.width ? Number(item.width) : null,
        height: item.height ? Number(item.height) : null,
        quantity: Number(item.quantity) || 1,
        area: calc.computedArea > 0 ? calc.computedArea : item.area ? Number(item.area) : null,
        rate: Number(item.rate) || 0,
        discount: Number(item.discount) || 0,
        taxRate: Number(item.taxRate) ?? 18.0,
        taxAmount: calc.taxAmount,
        totalAmount: calc.totalAmount,
      };
    });

    const totals = calculateDocumentTotals(
      calculatedItems.map((ci: any) => ({
        pricingType: ci.pricingType,
        unit: ci.unit,
        width: ci.width,
        height: ci.height,
        quantity: ci.quantity,
        area: ci.area,
        rate: ci.rate,
        discount: ci.discount,
        taxRate: ci.taxRate,
      }))
    );

    const paidAmount = Number(body.paidAmount) || 0;
    const balanceAmount = Math.max(0, totals.grandTotal - paidAmount);

    let calculatedStatus = body.status || 'DRAFT';
    if (paidAmount >= totals.grandTotal && totals.grandTotal > 0) {
      calculatedStatus = 'PAID';
    } else if (paidAmount > 0 && paidAmount < totals.grandTotal) {
      calculatedStatus = 'PARTIALLY_PAID';
    }

    const invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : new Date();
    const dueDate = body.dueDate ? new Date(body.dueDate) : new Date(invoiceDate.getTime() + 15 * 86400000);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: body.customerId,
        orderId: body.orderId || null,
        invoiceDate,
        dueDate,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        discountTotal: totals.discountTotal,
        grandTotal: totals.grandTotal,
        paidAmount,
        balanceAmount,
        status: calculatedStatus,
        notes: body.notes || null,
        terms: body.terms || null,
        items: {
          create: calculatedItems,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'An invoice with this number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
