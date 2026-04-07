'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/admin/image-upload'

export default function AdminSettingsPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((settings: { key: string; value: string }[]) => {
        const qr = settings.find((s) => s.key === 'community_qrcode_url')
        setQrCodeUrl(qr?.value ?? '')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'community_qrcode_url', value: qrCodeUrl }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }
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

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>社群二维码</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              加载中...
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                设置后将在社区详情页（登录用户可见）底部展示，引导用户加入 OPC 圈社群。
              </p>
              <ImageUpload
                value={qrCodeUrl || null}
                onChange={(url) => setQrCodeUrl(url)}
                label="二维码图片"
              />
              <div className="flex items-center gap-3 pt-2">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
