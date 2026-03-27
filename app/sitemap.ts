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
      url: `${baseUrl}/market`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/start`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
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
    url: `${baseUrl}/communities/${community.newSlug ?? community.slug}`,
    lastModified: community.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // 动态页面：合作广场订单
  const orders = await prisma.project.findMany({
    where: {
      status: 'PUBLISHED',
      contentType: { in: ['DEMAND', 'COOPERATION'] },
    },
    select: { slug: true, updatedAt: true },
  })

  const orderPages: MetadataRoute.Sitemap = orders.map((order) => ({
    url: `${baseUrl}/market/${order.slug}`,
    lastModified: order.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  // 动态页面：创业广场动态
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100, // 只取最新100条
  })

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/plaza/${post.id}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...communityPages, ...orderPages, ...postPages]
}
