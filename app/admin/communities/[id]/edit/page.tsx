import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import prisma from '@/lib/db'
import CommunityForm from '../../community-form'

interface Props {
  params: { id: string }
}

async function getCommunity(id: string) {
  const community = await prisma.community.findUnique({
    where: { id },
  })
  return community
}

export default async function EditCommunityPage({ params }: Props) {
  await requireAdmin()
  const community = await getCommunity(params.id)

  if (!community) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">编辑社区: {community.name}</h1>
      <CommunityForm mode="edit" initialData={community} />
    </div>
  )
}
