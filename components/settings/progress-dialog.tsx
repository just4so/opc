'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast-notification'
import { ImageUpload } from '@/components/ui/image-upload'

interface Props {
  projectSlug: string
  onClose: () => void
}

export function ProgressDialog({ projectSlug, onClose }: Props) {
  const { toast } = useToast()
  const [content, setContent] = useState('')
  const [milestone, setMilestone] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${projectSlug}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, milestone: milestone || null, images }),
      })
      if (res.ok) {
        toast('进展已记录', 'success')
        onClose()
      } else {
        const data = await res.json()
        toast(data.error || '提交失败', 'error')
      }
    } catch {
      toast('提交失败', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[32px] p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-ink">记录进展</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-card text-ash">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="今天有什么新进展？"
          maxLength={2000}
          rows={4}
          className="w-full rounded-2xl border border-hairline px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          value={milestone}
          onChange={e => setMilestone(e.target.value)}
          placeholder="里程碑标签（可选）"
          className="w-full mt-3 rounded-2xl border border-hairline px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="mt-3">
          <p className="text-xs text-mute mb-2">添加图片（最多4张）</p>
          <ImageUpload
            value={images}
            onChange={setImages}
            maxImages={4}
            uploadEndpoint="/api/upload/product-image"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || !content.trim()}>
            {submitting ? '提交中...' : '发布'}
          </Button>
        </div>
      </div>
    </div>
  )
}
