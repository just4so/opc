import { requireStaff } from '@/lib/admin'
import CommunitiesClient from './communities-client'

export default async function AdminCommunitiesPage() {
  await requireStaff()

  return <CommunitiesClient />
}
