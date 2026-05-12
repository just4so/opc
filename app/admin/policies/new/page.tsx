import { requireStaff } from '@/lib/admin'
import PolicyForm from '../policy-form'

export const dynamic = 'force-dynamic'

export default async function NewPolicyPage() {
  await requireStaff()

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">新增政策</h1>
      <PolicyForm mode="new" />
    </div>
  )
}
