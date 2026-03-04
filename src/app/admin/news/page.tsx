import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/db'
import { format } from 'date-fns'
import { requireAdmin } from '@/lib/admin'

async function getNews() {
  const news = await prisma.news.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 50,
  })
  return news
}

const CATEGORY_LABELS: Record<string, string> = {
  POLICY: '政策',
  FUNDING: '融资',
  EVENT: '活动',
  TECH: '技术',
  STORY: '故事',
}

export default async function AdminNewsPage() {
  await requireAdmin()
  const news = await getNews()

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">资讯管理</h1>

      <Card>
        <CardHeader>
          <CardTitle>资讯列表 ({news.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {news.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无资讯</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">标题</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">分类</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">来源</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">发布时间</th>
                  </tr>
                </thead>
                <tbody>
                  {news.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary line-clamp-1"
                        >
                          {item.title}
                        </a>
                        <div className="text-sm text-gray-500 line-clamp-1">{item.summary}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.source || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {format(new Date(item.publishedAt), 'yyyy-MM-dd HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
