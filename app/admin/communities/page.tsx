import { requireAdmin } from '@/lib/admin'
import CommunitiesClient from './communities-client'

export default async function AdminCommunitiesPage() {
  await requireAdmin()

  return <CommunitiesClient />
}
