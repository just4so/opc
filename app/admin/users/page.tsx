import { redirect } from 'next/navigation'
import { requireStaffContext } from '@/lib/admin'
import UsersClient from './users-client'

export default async function AdminUsersPage() {
  const staff = await requireStaffContext()
  if (staff.role === 'CITY_MANAGER') redirect('/admin')

  return <UsersClient currentUserRole={staff.role} />
}
