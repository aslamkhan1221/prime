import { NextRequest, NextResponse } from 'next/server';
import { getLibSql } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const db = getLibSql();
    let query = 'SELECT * FROM Vendor';
    const args: any[] = [];

    if (search) {
      query += ' WHERE displayName LIKE ? OR companyName LIKE ? OR email LIKE ? OR mobilePhone LIKE ?';
      const term = `%${search}%`;
      args.push(term, term, term, term);
    }

    query += ' ORDER BY createdAt DESC;';

    const res = await db.execute({ sql: query, args });
    return NextResponse.json({ success: true, vendors: res.rows });
  } catch (err: any) {
    console.error('Error fetching vendors:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.displayName) {
      return NextResponse.json({ error: 'Display Name is required' }, { status: 400 });
    }

    const id = 'vnd_' + Math.random().toString(36).substring(2, 11);
    const db = getLibSql();

    await db.execute({
      sql: `
        INSERT INTO Vendor (
          id, salutation, firstName, lastName, companyName, displayName,
          email, workPhone, mobilePhone, language, pan, isMsmeRegistered,
          currency, openingBalance, paymentTerms, tds, enablePortal,
          address, city, state, pincode, country,
          bankAccountName, bankAccountNumber, bankIfsc, bankName, remarks
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?
        );
      `,
      args: [
        id,
        body.salutation || '',
        body.firstName || '',
        body.lastName || '',
        body.companyName || '',
        body.displayName,
        body.email || '',
        body.workPhone || '',
        body.mobilePhone || '',
        body.language || 'English',
        body.pan || '',
        body.isMsmeRegistered ? 1 : 0,
        body.currency || 'INR',
        Number(body.openingBalance) || 0,
        body.paymentTerms || 'Due on Receipt',
        body.tds || '',
        body.enablePortal ? 1 : 0,
        body.address || '',
        body.city || '',
        body.state || '',
        body.pincode || '',
        body.country || 'India',
        body.bankAccountName || '',
        body.bankAccountNumber || '',
        body.bankIfsc || '',
        body.bankName || '',
        body.remarks || '',
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor created successfully',
      vendor: { id, ...body },
    });
  } catch (err: any) {
    console.error('Error creating vendor:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
