import { requireStaff } from '@/lib/admin'
import UsersClient from './users-client'

export default async function AdminUsersPage() {
  const staff = await requireStaff()

  return <UsersClient currentUserRole={staff.role} />
}
