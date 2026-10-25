import { NextRequest, NextResponse } from 'next/server';
import { getLibSql } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    const db = getLibSql();
    let query = 'SELECT * FROM CompanyDocument';
    const conditions: string[] = [];
    const args: any[] = [];

    if (category && category !== 'All') {
      conditions.push('category = ?');
      args.push(category);
    }

    if (search) {
      conditions.push('(title LIKE ? OR documentNumber LIKE ? OR notes LIKE ? OR fileName LIKE ?)');
      const term = `%${search}%`;
      args.push(term, term, term, term);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY createdAt DESC;';

    const res = await db.execute({ sql: query, args });
    return NextResponse.json({ success: true, documents: res.rows });
  } catch (err: any) {
    console.error('Error fetching company documents:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!body.title) {
      return NextResponse.json({ error: 'Document Title is required' }, { status: 400 });
    }

    if (!body.fileUrl) {
      return NextResponse.json({ error: 'Document file or data is required' }, { status: 400 });
    }

    const id = 'doc_' + Math.random().toString(36).substring(2, 11);
    const db = getLibSql();

    await db.execute({
      sql: `
        INSERT INTO CompanyDocument (
          id, title, category, documentNumber, fileUrl, fileName,
          fileType, fileSize, notes, expiryDate
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        );
      `,
      args: [
        id,
        body.title,
        body.category || 'General',
        body.documentNumber || '',
        body.fileUrl,
        body.fileName || 'document',
        body.fileType || 'application/pdf',
        Number(body.fileSize) || 0,
        body.notes || '',
        body.expiryDate || null,
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Document saved to locker successfully',
      document: { id, ...body },
    });
  } catch (err: any) {
    console.error('Error creating company document:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
