import { MetadataRoute } from 'next'
import prisma from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.opcquan.com'

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/communities`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/plaza`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news/signal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/models`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // 动态页面：社区详情
  const communities = await prisma.community.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
  })

  const communityPages: MetadataRoute.Sitemap = communities.map((community) => ({
    url: `${baseUrl}/communities/${community.slug}`,
    lastModified: community.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // 城市 SEO 页面
  const cities = await prisma.community.findMany({
    where: { status: 'ACTIVE', city: { not: '' } },
    distinct: ['city'],
    select: { city: true },
  })

  const cityPages: MetadataRoute.Sitemap = (cities as { city: string }[])
    .filter((c) => c.city.length > 0)
    .map((c) => ({
      url: `${baseUrl}/communities/city/${c.city}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

  // 动态页面：创业广场动态
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/plaza/${post.id}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // 动态页面：Signal 期刊
  const signalIssues = await prisma.signalIssue.findMany({
    where: { status: 'PUBLISHED' },
    select: { issueNo: true, publishedAt: true },
  })

  const signalPages: MetadataRoute.Sitemap = signalIssues.map((issue) => ({
    url: `${baseUrl}/news/signal/${issue.issueNo}`,
    lastModified: issue.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticPages, ...communityPages, ...cityPages, ...postPages, ...signalPages]
}
