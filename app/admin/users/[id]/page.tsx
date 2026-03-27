import prisma from '@/lib/db'
import { requireStaff } from '@/lib/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  await requireStaff()
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          content: true,
          type: true,
          topics: true,
          status: true,
          pinned: true,
          likeCount: true,
          createdAt: true,
          _count: { select: { comments: true } }
        }
      },
      _count: { select: { posts: true, comments: true } }
    }
  })

  if (!user) notFound()

  return (
    <div>
      {/* 返回按钮 */}
      <Link href="/admin/users" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
        ← 返回用户列表
      </Link>

      {/* 用户信息卡片 */}
      <Card className="mb-6 mt-3">
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">用户名：</span>{user.username}</div>
            <div><span className="text-gray-500">邮箱：</span>{user.email || '—'}</div>
            <div><span className="text-gray-500">角色：</span>{user.role}</div>
            <div><span className="text-gray-500">等级：</span>Lv.{user.level}</div>
            <div><span className="text-gray-500">赛道：</span>{user.mainTrack || '—'}</div>
            <div><span className="text-gray-500">阶段：</span>{user.startupStage || '—'}</div>
            <div><span className="text-gray-500">帖子数：</span>{user._count.posts}</div>
            <div><span className="text-gray-500">注册时间：</span>{format(new Date(user.createdAt), 'yyyy-MM-dd', { locale: zhCN })}</div>
          </div>
        </CardContent>
      </Card>

      {/* 帖子列表 */}
      <Card>
        <CardHeader>
          <CardTitle>Ta 的动态（最近20条）</CardTitle>
        </CardHeader>
        <CardContent>
          {user.posts.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无动态</p>
          ) : (
            <div className="space-y-3">
              {user.posts.map(post => (
                <div key={post.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{post.type}</Badge>
                    {post.topics.map(t => (
                      <span key={t} className="text-xs text-gray-500">#{t}</span>
                    ))}
                    {post.pinned && <Badge className="text-xs bg-orange-100 text-orange-700">精华</Badge>}
                    <span className="text-xs text-gray-400 ml-auto">
                      {format(new Date(post.createdAt), 'MM-dd HH:mm')} · 赞{post.likeCount} · 评{post._count.comments}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{post.content.slice(0, 200)}</p>
                  <a href={`/plaza/${post.id}`} target="_blank" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
                    查看详情 →
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
