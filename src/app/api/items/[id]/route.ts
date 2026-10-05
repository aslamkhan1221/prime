import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const item = await prisma.item.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const item = await prisma.item.update({
      where: { id: params.id },
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const invoiceItemCount = await prisma.invoiceItem.count({ where: { itemId: params.id } });
    const orderItemCount = await prisma.orderItem.count({ where: { itemId: params.id } });

    if (invoiceItemCount > 0 || orderItemCount > 0) {
      return NextResponse.json(
        {
          error: `Item is used in ${invoiceItemCount} invoice line(s) and ${orderItemCount} order line(s). Mark it as Inactive instead to preserve historical records.`,
        },
        { status: 400 }
      );
    }

    await prisma.item.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
