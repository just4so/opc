'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Upload, Loader2 } from 'lucide-react'

interface ManagerInfo {
  id: string
  name: string
  city: string | null
  province: string
  wechat: string | null
}

export function ManagerSection() {
  const [manager, setManager] = useState<ManagerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings/manager-qrcode')
      .then(r => r.json())
      .then(data => {
        setManager(data.manager)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const uploadRes = await fetch('/api/upload/qrcode', { method: 'POST', body: form })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || '上传失败')
      }
      const { url } = await uploadRes.json()

      const updateRes = await fetch('/api/settings/manager-qrcode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrcodeUrl: url }),
      })
      if (!updateRes.ok) {
        const err = await updateRes.json()
        throw new Error(err.error || '保存失败')
      }
      const { manager: updated } = await updateRes.json()
      setManager(updated)
      setToast('社群二维码已更新')
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setToast((err as Error).message || '操作失败')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const cityLabel = manager?.city || manager?.province

  return (
    <div className="space-y-6">
      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-2xl px-4 py-3">
          {toast}
        </div>
      )}

      <div className="bg-surface-card border border-hairline rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-ink">同城社群二维码</h3>
        <p className="text-sm text-mute leading-relaxed">
          上传你管理的同城 OPC 创业者微信群二维码。二维码会在同城页面展示给所有访客。
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-mute text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        ) : (
          <>
            {/* Current QR code preview */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div>
                <p className="text-xs font-medium text-mute mb-2">当前二维码</p>
                {manager?.wechat && manager.wechat.startsWith('http') ? (
                  <div className="border border-hairline rounded-2xl overflow-hidden w-[160px] h-[160px]">
                    <Image
                      src={manager.wechat}
                      alt="社群二维码"
                      width={160}
                      height={160}
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-[160px] h-[160px] border border-hairline rounded-2xl flex items-center justify-center bg-surface-soft text-center px-3">
                    <p className="text-xs text-ash leading-relaxed">还没有设置社群二维码</p>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 pt-6 sm:pt-0 sm:self-end">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />上传中...</>
                  ) : (
                    <><Upload className="h-4 w-4" />上传新二维码</>
                  )}
                </button>
                {cityLabel && (
                  <p className="text-xs text-mute">
                    此二维码将在「同城 · {cityLabel}」页面展示
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-ash border-t border-hairline pt-4">
              ⚠ 请确保二维码有效，失效后记得及时更换。
            </p>
          </>
        )}
      </div>
    </div>
  )
}
