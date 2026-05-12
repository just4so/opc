import { notFound } from 'next/navigation'
import { requireStaff } from '@/lib/admin'
import prisma from '@/lib/db'
import PolicyForm from '../../policy-form'

export const dynamic = 'force-dynamic'

export default async function EditPolicyPage({ params }: { params: { id: string } }) {
  await requireStaff()

  const policy = await prisma.policy.findUnique({ where: { id: params.id } })
  if (!policy) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">编辑政策</h1>
      <PolicyForm
        mode="edit"
        initialData={{
          id: policy.id,
          province: policy.province,
          city: policy.city ?? '',
          district: policy.district ?? '',
          title: policy.title,
          summary: policy.summary,
          sourceUrl: policy.sourceUrl ?? '',
          status: policy.status,
        }}
      />
    </div>
  )
}
