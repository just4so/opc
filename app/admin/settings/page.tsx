'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/admin/image-upload'

export default function AdminSettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [communityQrUrl, setCommunityQrUrl] = useState('')
  const [connectQrUrl, setConnectQrUrl] = useState('')
  const [helpQrUrl, setHelpQrUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'CITY_MANAGER') {
      router.replace('/admin')
    }
  }, [session, router])

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((settings: { key: string; value: string }[]) => {
        const communityQr = settings.find((s) => s.key === 'community_qrcode_url')
        setCommunityQrUrl(communityQr?.value ?? '')
        const connectQr = settings.find((s) => s.key === 'connect_qrcode_url')
        setConnectQrUrl(connectQr?.value ?? '')
        const helpQr = settings.find((s) => s.key === 'help_qrcode_url')
        setHelpQrUrl(helpQr?.value ?? '')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'community_qrcode_url', value: communityQrUrl }),
      })
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'connect_qrcode_url', value: connectQrUrl }),
      })
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'help_qrcode_url', value: helpQrUrl }),
      })
      setMessage('已保存')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">系统设置</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中...
        </div>
      ) : (
        <div className="space-y-6 max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>社群二维码</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                设置后将在社区详情页（登录用户可见）底部展示，引导用户加入 OPC 圈社群。
              </p>
              <ImageUpload
                value={communityQrUrl || null}
                onChange={(url) => setCommunityQrUrl(url)}
                label="二维码图片"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>直通车联系二维码</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                设置后将在直通车提交成功页面展示，引导用户添加联系方式。
              </p>
              <ImageUpload
                value={connectQrUrl || null}
                onChange={(url) => setConnectQrUrl(url)}
                label="二维码图片"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>帮助中心二维码</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                设置后将在全站右下角显示帮助按钮，用户点击后可扫码联系企业微信。未设置时按钮不显示。
              </p>
              <ImageUpload
                value={helpQrUrl || null}
                onChange={(url) => setHelpQrUrl(url)}
                label="企微二维码图片"
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
            {message && (
              <span className={`text-sm ${message === '已保存' ? 'text-green-600' : 'text-red-500'}`}>
                {message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
