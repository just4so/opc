'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload, Check, X } from 'lucide-react'

const PRESET_AVATARS = [
  // bottts style (机器人风格)
  { url: 'https://api.dicebear.com/9.x/bottts/svg?seed=opc', label: 'OPC' },
  { url: 'https://api.dicebear.com/9.x/bottts/svg?seed=ai', label: 'AI' },
  { url: 'https://api.dicebear.com/9.x/bottts/svg?seed=coder', label: 'Coder' },
  { url: 'https://api.dicebear.com/9.x/bottts/svg?seed=maker', label: 'Maker' },
  { url: 'https://api.dicebear.com/9.x/bottts/svg?seed=indie', label: 'Indie' },
  { url: 'https://api.dicebear.com/9.x/bottts/svg?seed=builder', label: 'Builder' },
  // lorelei style (人像风格)
  { url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=opc', label: 'OPC' },
  { url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=ai', label: 'AI' },
  { url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=coder', label: 'Coder' },
  { url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=maker', label: 'Maker' },
  { url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=indie', label: 'Indie' },
  { url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=builder', label: 'Builder' },
]

interface AvatarPickerProps {
  currentAvatar: string | null
  onSelect: (url: string) => void
  onClose: () => void
}

export function AvatarPicker({ currentAvatar, onSelect, onClose }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string>(currentAvatar || '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('仅支持 JPG、PNG、WebP、GIF 格式')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('图片大小不能超过 2MB')
      return
    }

    setUploadError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '上传失败')
      }

      const { url } = await res.json()
      setSelected(url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected)
    }
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary">选择头像</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Preview */}
      {selected && (
        <div className="flex justify-center">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected}
              alt="预览"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Preset avatars - bottts */}
      <div>
        <p className="text-sm text-gray-500 mb-2">机器人风格</p>
        <div className="grid grid-cols-6 gap-3">
          {PRESET_AVATARS.slice(0, 6).map((avatar) => (
            <button
              key={avatar.url}
              onClick={() => setSelected(avatar.url)}
              className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                selected === avatar.url
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar.url}
                alt={avatar.label}
                className="w-full h-full object-cover"
              />
              {selected === avatar.url && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preset avatars - lorelei */}
      <div>
        <p className="text-sm text-gray-500 mb-2">人像风格</p>
        <div className="grid grid-cols-6 gap-3">
          {PRESET_AVATARS.slice(6, 12).map((avatar) => (
            <button
              key={avatar.url}
              onClick={() => setSelected(avatar.url)}
              className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                selected === avatar.url
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar.url}
                alt={avatar.label}
                className="w-full h-full object-cover"
              />
              {selected === avatar.url && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Upload */}
      <div>
        <p className="text-sm text-gray-500 mb-2">自定义上传</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? '上传中...' : '上传图片'}
        </Button>
        <p className="text-xs text-gray-400 mt-1">支持 JPG/PNG/WebP/GIF，最大 2MB</p>
        {uploadError && (
          <p className="text-xs text-red-500 mt-1">{uploadError}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          取消
        </Button>
        <Button type="button" size="sm" onClick={handleConfirm} disabled={!selected}>
          确认选择
        </Button>
      </div>
    </div>
  )
}
