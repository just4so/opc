import { unstable_cache } from 'next/cache'
import prisma from '@/lib/db'

/**
 * 直通车城市列表 — 缓存 10 分钟
 * 社区数量不频繁变化，不需要每次请求都跑 groupBy 全表聚合
 */
export const getCachedCityNames = unstable_cache(
  async (): Promise<string[]> => {
    const cityGroups = await prisma.community.groupBy({
      by: ['city'],
      where: { status: 'ACTIVE', city: { not: '' } },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
    })
    return cityGroups
      .map((c) => c.city)
      .filter((c): c is string => !!c)
  },
  ['connect-city-names'],
  { revalidate: 600 } // 10 分钟
)

/**
 * 直通车社区列表 — 缓存 10 分钟
 * 通用直通车页用，不含联系方式
 */
export const getCachedCommunityList = unstable_cache(
  async () => {
    return prisma.community.findMany({
      where: { status: 'ACTIVE' },
      select: { name: true, slug: true, city: true },
      orderBy: { name: 'asc' },
    })
  },
  ['connect-community-list'],
  { revalidate: 600 }
)
