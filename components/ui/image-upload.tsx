'use client'

import { useRef, useState } from 'react'
import { Plus, X, Loader2, ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  uploadEndpoint?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  maxImages = 5,
  uploadEndpoint = '/api/upload/product-image',
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '上传失败')
        return
      }

      const { url } = await res.json()
      onChange([...value, url])
    } catch {
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {value.map((url, index) => (
        <div
          key={url}
          className="relative aspect-square rounded-2xl overflow-hidden border border-hairline group"
        >
          <img
            src={url}
            alt={`产品图片 ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {index === 0 && (
            <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
              封面
            </span>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}

      {value.length < maxImages && !disabled && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-2xl border-2 border-dashed border-hairline flex flex-col items-center justify-center gap-2 text-mute hover:border-primary hover:text-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs">添加图片</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
