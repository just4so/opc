import { requireStaffContext } from '@/lib/admin'
import { LogsClient } from './logs-client'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const staff = await requireStaffContext()
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">操作日志</h1>
        <p className="text-sm text-mute mt-1">
          {staff.role === 'CITY_MANAGER' ? '你的操作记录' : '所有管理员的操作记录'}
        </p>
      </div>
      <LogsClient role={staff.role} selfId={staff.id} />
    </div>
  )
}
