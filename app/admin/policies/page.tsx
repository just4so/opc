import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireStaff } from '@/lib/admin'
import prisma from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PoliciesClient from './policies-client'

export const dynamic = 'force-dynamic'

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: { province?: string; status?: string }
}) {
  await requireStaff()

  const province = searchParams.province || ''
  const status = searchParams.status || ''

  const where: any = {}
  if (province) where.province = province
  if (status) where.status = status

  const [policies, total, provinces, cityGroups] = await Promise.all([
    prisma.policy.findMany({
      where,
      orderBy: [{ province: 'asc' }, { city: 'asc' }, { district: 'asc' }],
    }),
    prisma.policy.count({ where }),
    prisma.policy.findMany({
      select: { province: true },
      distinct: ['province'],
      orderBy: { province: 'asc' },
    }),
    prisma.policy.groupBy({
      by: ['city'],
      where: { city: { not: null } },
    }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">政策管理</h1>
        <Link href="/admin/policies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新增政策
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            政策列表
            <span className="text-sm font-normal text-gray-500 ml-2">
              (共 {total} 条政策，覆盖 {cityGroups.length} 个城市)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PoliciesClient
            policies={policies.map((p) => ({
              ...p,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
            }))}
            provinces={provinces.map((p) => p.province)}
            currentProvince={province}
            currentStatus={status}
          />
        </CardContent>
      </Card>
    </div>
  )
}
