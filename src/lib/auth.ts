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
      // Instant fast-path: Session token is cryptographically verified by getSession()
      return {
        id: session.userId || 'admin_default',
        email: session.email || 'primeadmin',
        name: session.name || 'Prime Admin',
        role: session.role || 'ADMIN',
        partnerId: null,
        partnerName: null,
        permissions: null,
      };
    }
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
  }

  // Not authenticated
  return null;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
