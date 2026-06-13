import { redirect } from 'next/navigation'
import { requireStaffContext } from '@/lib/admin'
import prisma from '@/lib/db'
import { MyProfileClient } from './my-profile-client'

export default async function MyProfilePage() {
  const ctx = await requireStaffContext()

  if (ctx.role !== 'CITY_MANAGER') {
    redirect('/admin')
  }

  const manager = await prisma.cityManager.findUnique({
    where: { userId: ctx.id },
  })

  return <MyProfileClient manager={manager} />
}
