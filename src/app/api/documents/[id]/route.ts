import { NextRequest, NextResponse } from 'next/server';
import { getLibSql } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const db = getLibSql();
    await db.execute({
      sql: 'DELETE FROM CompanyDocument WHERE id = ?;',
      args: [id],
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting document:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
