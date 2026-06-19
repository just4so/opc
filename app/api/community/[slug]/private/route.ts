import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decodedSlug = decodeURIComponent(params.slug)

  const community = await prisma.community.findFirst({
    where: {
      OR: [
        { slug: decodedSlug },
        { id: decodedSlug },
      ],
    },
    select: {
      id: true,
      entryInfo: true,
      realTips: true,
      images: true,
      amenities: true,
      contactName: true,
      contactPhone: true,
      contactWechat: true,
      contactNote: true,
    },
  })

  if (!community) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const unlocked = (await prisma.inquiry.count({ where: { userId: session.user.id, communityId: community.id } })) > 0

  return NextResponse.json({
    entryInfo: community.entryInfo,
    realTips: community.realTips,
    images: community.images,
    amenities: community.amenities,
    contactName: community.contactName,
    contactPhone: unlocked ? community.contactPhone : null,
    contactWechat: unlocked ? community.contactWechat : null,
    contactNote: community.contactNote,
    unlocked,
  })
}
