'use client'

import { useState, useRef } from 'react'
import { Upload, X, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload/community-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '上传失败')
      onChange(data.url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex items-start gap-3">
        {/* 缩略图预览 */}
        {value ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
            <Image src={value} alt="预览" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/70"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 bg-gray-50">
            <Upload className="h-6 w-6 text-gray-300" />
          </div>
        )}

        <div className="flex-1 space-y-2">
          {/* 上传按钮 */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                上传中...
              </span>
            ) : (
              <span className="flex items-center gap-1"><Upload className="h-3.5 w-3.5" />上传图片</span>
            )}
          </Button>

          {/* URL fallback */}
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-primary flex items-center gap-1"
            onClick={() => setShowUrlInput(!showUrlInput)}
          >
            <LinkIcon className="h-3 w-3" />通过 URL 设置
          </button>
          {showUrlInput && (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => { if (urlInput) { onChange(urlInput); setShowUrlInput(false); setUrlInput('') } }}
              >确认</Button>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}
