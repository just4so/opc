import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { ConnectForm } from '@/components/connect/connect-form'
import { CITIES } from '@/constants/cities'

export const metadata: Metadata = {
  title: '社区直通车 - OPC圈',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: { slug: string }
}

export default async function ConnectPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/connect/${params.slug}`)
  }

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      contactName: true,
      contactPhone: true,
      contactWechat: true,
    },
  })

  if (!community) {
    notFound()
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      phone: true,
      wechat: true,
      location: true,
      mainTrack: true,
      startupStage: true,
    },
  })

  const cityNames = CITIES.map((c) => c.name)

  return (
    <div className="min-h-screen bg-surface-soft">
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <ConnectForm
          community={{
            slug: community.slug,
            name: community.name,
            city: community.city,
            contactName: community.contactName,
            contactPhone: community.contactPhone,
            contactWechat: community.contactWechat,
          }}
          user={{
            name: user?.name ?? '',
            contact: user?.wechat || user?.phone || '',
            location: user?.location ?? '',
            mainTrack: user?.mainTrack ?? '',
            startupStage: user?.startupStage ?? '',
          }}
          cities={cityNames}
        />
      </div>
    </div>
  )
}
