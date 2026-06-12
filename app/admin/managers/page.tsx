import { requireAdmin } from '@/lib/admin'
import ManagersClient from './managers-client'

export default async function AdminManagersPage() {
  await requireAdmin()
  return <ManagersClient />
}
