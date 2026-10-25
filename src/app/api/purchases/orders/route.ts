import { NextRequest, NextResponse } from 'next/server';
import { getLibSql } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getLibSql();
    const res = await db.execute(`
      SELECT po.*, v.displayName as vendorName, v.companyName as vendorCompany
      FROM PurchaseOrder po
      LEFT JOIN Vendor v ON po.vendorId = v.id
      ORDER BY po.createdAt DESC;
    `);

    return NextResponse.json({ success: true, orders: res.rows });
  } catch (err: any) {
    console.error('Error fetching purchase orders:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.vendorId) {
      return NextResponse.json({ error: 'Vendor is required' }, { status: 400 });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
    }

    const id = 'po_' + Math.random().toString(36).substring(2, 11);
    const db = getLibSql();

    // Auto-generate PO number if not provided
    let poNumber = body.poNumber;
    if (!poNumber) {
      const countRes = await db.execute('SELECT COUNT(*) as count FROM PurchaseOrder;');
      const count = Number(countRes.rows[0]?.count || 0) + 1;
      poNumber = `PO-${String(count).padStart(5, '0')}`;
    }

    // Insert PurchaseOrder
    await db.execute({
      sql: `
        INSERT INTO PurchaseOrder (
          id, poNumber, vendorId, referenceNumber, orderDate, deliveryDate,
          deliveryAddressType, deliveryAddress, paymentTerms, shipmentPreference,
          subtotal, discount, taxTotal, adjustment, total, status, notes, terms
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?
        );
      `,
      args: [
        id,
        poNumber,
        body.vendorId,
        body.referenceNumber || '',
        body.orderDate || new Date().toISOString(),
        body.deliveryDate || null,
        body.deliveryAddressType || 'ORGANIZATION',
        body.deliveryAddress || '',
        body.paymentTerms || 'Due on Receipt',
        body.shipmentPreference || '',
        Number(body.subtotal) || 0,
        Number(body.discount) || 0,
        Number(body.taxTotal) || 0,
        Number(body.adjustment) || 0,
        Number(body.total) || 0,
        body.status || 'DRAFT',
        body.notes || '',
        body.terms || '',
      ],
    });

    // Insert Items
    for (const item of body.items) {
      const itemId = 'poi_' + Math.random().toString(36).substring(2, 11);
      await db.execute({
        sql: `
          INSERT INTO PurchaseOrderItem (
            id, purchaseOrderId, itemId, name, description, account,
            quantity, rate, discount, taxRate, taxAmount, totalAmount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        args: [
          itemId,
          id,
          item.itemId || null,
          item.name || 'Material Item',
          item.description || '',
          item.account || 'Cost of Goods Sold',
          Number(item.quantity) || 1,
          Number(item.rate) || 0,
          Number(item.discount) || 0,
          Number(item.taxRate) || 18,
          Number(item.taxAmount) || 0,
          Number(item.totalAmount) || 0,
        ],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase Order created successfully',
      order: { id, poNumber, ...body },
    });
  } catch (err: any) {
    console.error('Error creating purchase order:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
