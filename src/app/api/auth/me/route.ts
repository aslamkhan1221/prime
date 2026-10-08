import { NextResponse } from 'next/server';
import { getCurrentUser, DEFAULT_ADMIN_USER } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = (await getCurrentUser()) || DEFAULT_ADMIN_USER;
  return NextResponse.json({ authenticated: true, user });
}

