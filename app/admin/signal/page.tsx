import Link from 'next/link'
import { requireStaff } from '@/lib/admin'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminSignalPage() {
  await requireStaff()

  const issues = await prisma.signalIssue.findMany({
    orderBy: { issueNo: 'desc' },
    select: { id: true, issueNo: true, title: true, publishedAt: true, status: true },
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Signal 管理</h1>
        <Link
          href="/admin/signal/new"
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          新建期号
        </Link>
      </div>

      <div className="bg-canvas rounded-2xl border border-hairline-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-card border-b border-hairline-soft">
            <tr>
              <th className="text-left px-4 py-3 text-mute font-medium">期号</th>
              <th className="text-left px-4 py-3 text-mute font-medium">标题</th>
              <th className="text-left px-4 py-3 text-mute font-medium">日期</th>
              <th className="text-left px-4 py-3 text-mute font-medium">状态</th>
              <th className="text-left px-4 py-3 text-mute font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {issues.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ash">
                  暂无期号，点击「新建期号」开始
                </td>
              </tr>
            ) : (
              issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-surface-card transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">第 {issue.issueNo} 期</td>
                  <td className="px-4 py-3 text-ink max-w-xs truncate">{issue.title}</td>
                  <td className="px-4 py-3 text-mute">
                    {issue.publishedAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        issue.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {issue.status === 'PUBLISHED' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/signal/${issue.id}`}
                      className="text-primary hover:underline text-sm"
                    >
                      预览
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
