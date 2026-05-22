import { requireStaff } from '@/lib/admin'
import { InquiriesClient } from './inquiries-client'

export const dynamic = 'force-dynamic'

export default async function AdminInquiriesPage() {
  await requireStaff()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">意向管理</h1>
      <InquiriesClient />
    </div>
  )
}
