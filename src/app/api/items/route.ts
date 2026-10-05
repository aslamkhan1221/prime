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
    const category = searchParams.get('category') || '';
    const itemType = searchParams.get('itemType') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (itemType && itemType !== 'ALL') {
      where.itemType = itemType;
    }

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ items });
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
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        name: body.name.trim(),
        sku: body.sku?.trim() || null,
        description: body.description?.trim() || null,
        category: body.category?.trim() || 'Graphic Design',
        itemType: body.itemType || 'SERVICE',
        price: Number(body.price) || 0,
        costPrice: Number(body.costPrice) || 0,
        taxRate: Number(body.taxRate) ?? 18.0,
        unit: body.unit || 'PIECE',
        customUnit: body.customUnit?.trim() || null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'An item with this SKU already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
