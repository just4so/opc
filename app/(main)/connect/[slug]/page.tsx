import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { ConnectForm } from '@/components/connect/connect-form'
import { getCachedCityNames } from '@/lib/queries/connect'

function parseGeoCity(headerValue: string | null): string {
  if (!headerValue) return ''
  try {
    const decoded = decodeURIComponent(headerValue)
    const match = decoded.match(/city_name="([^"]+)"/)
    return match?.[1] || ''
  } catch {
    return ''
  }
}

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

  const headersList = headers()
  const geoCity = parseGeoCity(headersList.get('eo-connecting-geo'))

  const [community, user, cityNames] = await Promise.all([
    prisma.community.findUnique({
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
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        phone: true,
        wechat: true,
        location: true,
        mainTrack: true,
        mainTracks: true,
        startupStage: true,
      },
    }),
    getCachedCityNames(),
  ])

  if (!community) {
    notFound()
  }

  const defaultCity = cityNames.includes(geoCity) ? geoCity : ''

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
            location: defaultCity,
            mainTracks: user?.mainTracks ?? [],
            startupStage: user?.startupStage ?? '',
          }}
          cities={cityNames}
        />
      </div>
    </div>
  )
}
