import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { getCitiesForScope } from '@/lib/china-regions'

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR' | 'CITY_MANAGER'
type StaffUser = { id: string; role: UserRole; username: string; name: string | null }

// 允许 ADMIN、MODERATOR 和 CITY_MANAGER 访问后台
export async function requireStaff() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, username: true, name: true },
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR' && user.role !== 'CITY_MANAGER')) {
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
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR' && user.role !== 'CITY_MANAGER')) {
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

  return user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?.role === 'CITY_MANAGER'
}

export type StaffContext = {
  id: string
  role: UserRole
  username: string
  name: string | null
  /** CITY_MANAGER: expanded list of managed cities; ADMIN/MODERATOR: null (unrestricted) */
  managedCities: string[] | null
  managerScope: { scope: 'CITY' | 'PROVINCE'; city?: string | null; province: string } | null
}

/** Page version: no permission → redirect */
export async function requireStaffContext(): Promise<StaffContext> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, role: true, username: true, name: true,
      cityManagerProfile: {
        select: { scope: true, city: true, province: true, status: true },
      },
    },
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR' && user.role !== 'CITY_MANAGER')) {
    redirect('/')
  }

  if (user.role === 'CITY_MANAGER') {
    if (!user.cityManagerProfile || user.cityManagerProfile.status !== 'ACTIVE') {
      redirect('/')
    }
    const { scope, city, province } = user.cityManagerProfile
    const managedCities = getCitiesForScope(scope as 'CITY' | 'PROVINCE', city, province)
    return {
      id: user.id, role: user.role as UserRole, username: user.username, name: user.name,
      managedCities,
      managerScope: { scope: scope as 'CITY' | 'PROVINCE', city, province },
    }
  }

  return {
    id: user.id, role: user.role as UserRole, username: user.username, name: user.name,
    managedCities: null,
    managerScope: null,
  }
}

/** API version: no permission → JSON error response */
export async function requireStaffContextApi(): Promise<StaffContext | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, role: true, username: true, name: true,
      cityManagerProfile: {
        select: { scope: true, city: true, province: true, status: true },
      },
    },
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR' && user.role !== 'CITY_MANAGER')) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  if (user.role === 'CITY_MANAGER') {
    if (!user.cityManagerProfile || user.cityManagerProfile.status !== 'ACTIVE') {
      return NextResponse.json({ error: '主理人账号已停用' }, { status: 403 })
    }
    const { scope, city, province } = user.cityManagerProfile
    const managedCities = getCitiesForScope(scope as 'CITY' | 'PROVINCE', city, province)
    return {
      id: user.id, role: user.role as UserRole, username: user.username, name: user.name,
      managedCities,
      managerScope: { scope: scope as 'CITY' | 'PROVINCE', city, province },
    }
  }

  return {
    id: user.id, role: user.role as UserRole, username: user.username, name: user.name,
    managedCities: null,
    managerScope: null,
  }
}

/** Generate Prisma city filter for a staff context */
export function cityFilter(ctx: StaffContext): { city?: { in: string[] } } {
  if (ctx.managedCities === null) return {}
  return { city: { in: ctx.managedCities } }
}

/** Check whether a target city is within the staff's managed scope */
export function isInScope(ctx: StaffContext, targetCity: string | null | undefined): boolean {
  if (ctx.managedCities === null) return true
  if (!targetCity) return false
  return ctx.managedCities.includes(targetCity)
}
