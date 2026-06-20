import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { ConnectForm } from '@/components/connect/connect-form'
import { getCachedCityNames, getCachedCommunityList } from '@/lib/queries/connect'

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
  robots: { index: false },
}

export default async function GenericConnectPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/connect')
  }

  const headersList = headers()
  const geoCity = parseGeoCity(headersList.get('eo-connecting-geo'))

  const [communities, user, cityNames] = await Promise.all([
    getCachedCommunityList(),
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

  // Geo 城市在列表里才预填，不用 user.location（个人所在地 ≠ 目标入驻城市）
  const defaultCity = cityNames.includes(geoCity) ? geoCity : ''

  return (
    <div className="min-h-screen bg-surface-soft">
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <ConnectForm
          community={null}
          user={{
            name: user?.name ?? '',
            contact: user?.wechat || user?.phone || '',
            location: defaultCity,
            mainTracks: user?.mainTracks ?? [],
            startupStage: user?.startupStage ?? '',
          }}
          cities={cityNames}
          communities={communities}
        />
      </div>
    </div>
  )
}
