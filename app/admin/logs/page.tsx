import { requireStaff } from '@/lib/admin'

export default async function AdminLogsPage() {
  await requireStaff()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">操作日志</h1>
        <p className="text-mute text-sm mt-1">记录所有后台操作的完整日志（M3 实现）</p>
      </div>
      <div className="bg-white rounded-2xl border border-hairline p-12 text-center text-mute">
        操作日志功能将在 M3 实现
      </div>
    </div>
  )
}
