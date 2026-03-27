import { requireStaff } from '@/lib/admin'
import CommunityForm from '../community-form'

export default async function NewCommunityPage() {
  await requireStaff()

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">新建社区</h1>
      <CommunityForm mode="create" />
    </div>
  )
}
