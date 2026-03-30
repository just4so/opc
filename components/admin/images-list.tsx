'use client'

import { useState, useRef } from 'react'
import { Plus, X, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ImagesListProps {
  value: string[]
  onChange: (urls: string[]) => void
}

export function ImagesList({ value: rawValue, onChange }: ImagesListProps) {
  const value = Array.isArray(rawValue) ? rawValue : []
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload/community-image', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '上传失败')
    return data.url
  }

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    setError('')
    const newUrls: string[] = []
    try {
      for (const file of Array.from(files)) {
        const url = await uploadFile(file)
        newUrls.push(url)
      }
      onChange([...value, ...newUrls])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const addUrl = () => {
    if (urlInput.trim()) {
      onChange([...value, urlInput.trim()])
      setUrlInput('')
      setShowUrlInput(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* 缩略图网格 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, index) => (
            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
              <Image src={url} alt={`图片 ${index + 1}`} fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 操作区 */}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = '' }}
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
            <span className="flex items-center gap-1"><Plus className="h-3.5 w-3.5" />添加图片</span>
          )}
        </Button>
        <button
          type="button"
          className="text-xs text-gray-400 hover:text-primary flex items-center gap-1"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <LinkIcon className="h-3 w-3" />通过 URL 添加
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
            placeholder="https://..."
            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <Button type="button" size="sm" variant="outline" onClick={addUrl}>添加</Button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
