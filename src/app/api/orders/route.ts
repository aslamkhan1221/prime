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
    const partnerIdParam = searchParams.get('partnerId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    // If logged in as Partner, only show orders assigned to this partner
    if (user.role === 'PARTNER') {
      if (user.partnerId) {
        where.assignedPartnerId = user.partnerId;
      }
    } else if (partnerIdParam && partnerIdParam !== 'ALL') {
      if (partnerIdParam === 'UNASSIGNED') {
        where.assignedPartnerId = null;
      } else {
        where.assignedPartnerId = partnerIdParam;
      }
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { companyName: { contains: search } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: { id: true, name: true, companyName: true, mobile: true, email: true },
        },
        assignedPartner: {
          select: { id: true, name: true, email: true },
        },
        items: true,
      },
    });

    return NextResponse.json({ orders });
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
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Generate Order Number
    let orderNumber = body.orderNumber;
    if (!orderNumber) {
      const settings = await prisma.companySetting.findUnique({ where: { id: 'default' } });
      const prefix = settings?.orderPrefix || 'ORD-';
      const orderCount = await prisma.order.count();
      const startNum = settings?.orderNumberStart || 1001;
      orderNumber = `${prefix}${startNum + orderCount}`;
    }

    // Process & calculate items server-side
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

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: body.customerId,
        assignedPartnerId: body.assignedPartnerId || null,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        discountTotal: totals.discountTotal,
        grandTotal: totals.grandTotal,
        status: body.status || 'PENDING',
        notes: body.notes || null,
        items: {
          create: calculatedItems,
        },
      },
      include: {
        customer: true,
        assignedPartner: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Order number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
