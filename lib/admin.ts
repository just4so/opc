import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

type UserRole = 'USER' | 'ADMIN' | 'MODERATOR'
type StaffUser = { id: string; role: UserRole; username: string; name: string | null }

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

  return user as StaffUser
}

/**
 * API 路由版本的 requireStaff，返回 JSON 响应而不是 redirect
 * 用法：const staff = await requireStaffApi(); if (staff instanceof NextResponse) return staff;
 */
export async function requireStaffApi(): Promise<StaffUser | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, username: true, name: true },
  })
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }
  return user as StaffUser
}

/**
 * API 路由版本的 requireAdmin，仅 ADMIN 可访问
 */
export async function requireAdminApi(): Promise<StaffUser | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, username: true, name: true },
  })
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }
  return user as StaffUser
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
