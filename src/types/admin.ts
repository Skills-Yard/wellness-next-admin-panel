// See prisma/schema/admin.prisma (wellness-backend) — mirrors the Admin model, minus
// passwordHash: the backend's GET /admin currently returns that field too (findAll() has no
// Prisma `select`), but there's no reason for this type — or anything rendered from it — to
// know it exists.
export type AdminRole = 'SUPER_ADMIN' | 'OPERATIONS' | 'FINANCE' | 'CONTENT' | 'SUPPORT';

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
