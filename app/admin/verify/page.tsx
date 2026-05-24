import { requireStaff } from '@/lib/admin'
import { VerifyClient } from './verify-client'

export const dynamic = 'force-dynamic'

export default async function AdminVerifyPage() {
  await requireStaff()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">认证管理</h1>
      <VerifyClient />
    </div>
  )
}
