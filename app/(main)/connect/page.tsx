import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import { ConnectForm } from '@/components/connect/connect-form'

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
  const geoHeader = headersList.get('eo-connecting-geo')
  const geoCity = parseGeoCity(geoHeader)

  const [communities, user] = await Promise.all([
    prisma.community.findMany({
      where: { status: 'ACTIVE' },
      select: { name: true, slug: true, city: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        phone: true,
        wechat: true,
        location: true,
        mainTrack: true,
        startupStage: true,
      },
    }),
  ])

  const cityGroups = await prisma.community.groupBy({
    by: ['city'],
    where: { status: 'ACTIVE', city: { not: '' } },
    _count: { city: true },
    orderBy: { _count: { city: 'desc' } },
  })
  const cityNames = cityGroups
    .map((c) => c.city)
    .filter((c): c is string => !!c)

  // 城市优先级：用户已保存的 location > Geo 自动定位
  const defaultCity = user?.location || (cityNames.includes(geoCity) ? geoCity : '')

  return (
    <div className="min-h-screen bg-surface-soft">
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <ConnectForm
          community={null}
          user={{
            name: user?.name ?? '',
            contact: user?.wechat || user?.phone || '',
            location: defaultCity,
            mainTrack: user?.mainTrack ?? '',
            startupStage: user?.startupStage ?? '',
          }}
          cities={cityNames}
          communities={communities}
        />
      </div>
    </div>
  )
}
