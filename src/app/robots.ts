import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/settings/', '/plaza/new', '/market/new'],
      },
    ],
    sitemap: 'https://www.opcquan.com/sitemap.xml',
  }
}
