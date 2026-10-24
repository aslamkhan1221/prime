import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'prime_sublimation_secure_jwt_key_2026';
const COOKIE_NAME = 'prime_session_token';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const DEFAULT_ADMIN_USER = {
  id: 'admin_default',
  email: 'primeadmin',
  name: 'Prime Admin',
  role: 'ADMIN',
  createdAt: new Date(),
  partnerId: null,
  partnerName: null,
  permissions: null,
};

export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (session?.userId || session?.email) {
      // Default superadmin quick resolution
      if (session.userId === 'admin_default' || session.email === 'primeadmin') {
        try {
          const user = await prisma.user.findFirst({
            where: { OR: [{ email: 'primeadmin' }, { id: session.userId }] },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
          });
          if (user) {
            return {
              ...user,
              partnerId: null,
              partnerName: null,
              permissions: null,
            };
          }
        } catch {
          // In case DB is temporarily unreachable, still return superadmin
        }
        return DEFAULT_ADMIN_USER;
      }

      if (session.userId) {
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
          select: { id: true, email: true, name: true, role: true, createdAt: true },
        });

        if (user) {
          let partner: any = null;
          if (user.role === 'PARTNER' || user.email) {
            try {
              partner = await prisma.partner.findFirst({
                where: { email: user.email },
              });
            } catch {}
          }

          let permissions: string[] | null = null;
          if (partner?.permissions) {
            try {
              permissions = JSON.parse(partner.permissions);
            } catch {
              permissions = ['dashboard', 'orders', 'invoices', 'reports'];
            }
          } else if (user.role === 'PARTNER') {
            permissions = ['dashboard', 'orders', 'invoices', 'reports'];
          }

          return {
            ...user,
            partnerId: partner?.id || null,
            partnerName: partner?.name || null,
            permissions,
          };
        }
      }
    }
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
  }

  // Not authenticated
  return null;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
