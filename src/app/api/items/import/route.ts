import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const items = body.items;
    const conflictMode = body.conflictMode || 'skip'; // 'skip' | 'update' | 'create_always'

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided for import' }, { status: 400 });
    }

    // Fetch existing items for duplicate detection
    const existingItems = await prisma.item.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });

    const skuMap = new Map<string, string>(); // sku.toLowerCase() -> id
    const nameMap = new Map<string, string>(); // name.toLowerCase() -> id

    existingItems.forEach((it) => {
      if (it.sku) skuMap.set(it.sku.trim().toLowerCase(), it.id);
      if (it.name) nameMap.set(it.name.trim().toLowerCase(), it.id);
    });

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const raw = items[i];
      const rowNum = i + 1;

      const name = String(raw.name ?? '').trim();
      if (!name) {
        errors.push(`Row ${rowNum}: Item Name is required and was empty. Skipped.`);
        skippedCount++;
        continue;
      }

      const sku = raw.sku ? String(raw.sku).trim() : null;
      const rawType = String(raw.itemType ?? '').trim().toUpperCase();
      const itemType = rawType === 'SERVICE' ? 'SERVICE' : 'GOODS';

      // Parse numerical values safely
      const price = raw.price !== undefined && raw.price !== '' ? Number(raw.price) || 0 : 0;
      const costPrice = raw.costPrice !== undefined && raw.costPrice !== '' ? Number(raw.costPrice) || 0 : 0;
      const taxRate = raw.taxRate !== undefined && raw.taxRate !== '' ? Number(raw.taxRate) || 0 : 18.0;

      // Parse status
      let isActive = true;
      if (raw.isActive !== undefined && raw.isActive !== '') {
        const strVal = String(raw.isActive).trim().toLowerCase();
        isActive = strVal === 'true' || strVal === '1' || strVal === 'yes' || strVal === 'active';
      }

      const itemData: any = {
        name,
        itemType,
        price,
        costPrice,
        taxRate,
        isActive,
      };

      if (sku) itemData.sku = sku;
      if (raw.category !== undefined && raw.category !== '') itemData.category = String(raw.category).trim();
      if (raw.unit !== undefined && raw.unit !== '') itemData.unit = String(raw.unit).trim();
      if (raw.customUnit !== undefined && raw.customUnit !== '') itemData.customUnit = String(raw.customUnit).trim();
      if (raw.description !== undefined && raw.description !== '') itemData.description = String(raw.description).trim();
      if (raw.salesAccount !== undefined && raw.salesAccount !== '') itemData.salesAccount = String(raw.salesAccount).trim();
      if (raw.purchaseAccount !== undefined && raw.purchaseAccount !== '') itemData.purchaseAccount = String(raw.purchaseAccount).trim();
      if (raw.purchaseDescription !== undefined && raw.purchaseDescription !== '') itemData.purchaseDescription = String(raw.purchaseDescription).trim();
      if (raw.preferredVendor !== undefined && raw.preferredVendor !== '') itemData.preferredVendor = String(raw.preferredVendor).trim();

      // Check if duplicate exists
      let existingId: string | undefined;
      if (sku && skuMap.has(sku.toLowerCase())) {
        existingId = skuMap.get(sku.toLowerCase());
      } else if (nameMap.has(name.toLowerCase())) {
        existingId = nameMap.get(name.toLowerCase());
      }

      if (existingId) {
        if (conflictMode === 'skip') {
          skippedCount++;
          continue;
        } else if (conflictMode === 'update') {
          try {
            await prisma.item.update({
              where: { id: existingId },
              data: itemData,
            });
            updatedCount++;
            continue;
          } catch (err: any) {
            errors.push(`Row ${rowNum} (${name}): Update failed - ${err.message}`);
            skippedCount++;
            continue;
          }
        }
        // If conflictMode === 'create_always', fall through to creation
        // If SKU exists, avoid unique constraint error by nullifying or appending random suffix
        if (sku && skuMap.has(sku.toLowerCase())) {
          itemData.sku = `${sku}-${Date.now().toString().slice(-4)}`;
        }
      }

      try {
        const created = await prisma.item.create({
          data: {
            ...itemData,
            category: itemData.category || 'Graphic Design',
            unit: itemData.unit || 'pcs',
            salesAccount: itemData.salesAccount || 'Sales',
            purchaseAccount: itemData.purchaseAccount || 'Cost of Goods Sold',
          },
        });
        createdCount++;
        nameMap.set(name.toLowerCase(), created.id);
        if (created.sku) skuMap.set(created.sku.toLowerCase(), created.id);
      } catch (err: any) {
        errors.push(`Row ${rowNum} (${name}): Failed to create - ${err.message}`);
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      total: items.length,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
