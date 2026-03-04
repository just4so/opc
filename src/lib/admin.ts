import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

type UserRole = 'USER' | 'ADMIN' | 'MODERATOR'

// 允许 ADMIN 和 MODERATOR 访问后台
export async function requireStaff() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, username: true, name: true },
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    redirect('/')
  }

  return user as { id: string; role: UserRole; username: string; name: string | null }
}

// 仅允许 ADMIN
export async function requireAdmin() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, username: true, name: true },
  })

  if (!user || user.role !== 'ADMIN') {
    redirect('/')
  }

  return user
}

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return user?.role === 'ADMIN'
}

export async function isStaff(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return user?.role === 'ADMIN' || user?.role === 'MODERATOR'
}
