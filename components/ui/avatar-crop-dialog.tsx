'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'

async function getCroppedImg(imageSrc: string, croppedAreaPixels: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(
        image,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0,
        croppedAreaPixels.width, croppedAreaPixels.height
      )
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/jpeg',
        0.9
      )
    }
    image.onerror = reject
    image.src = imageSrc
  })
}

interface AvatarCropDialogProps {
  open: boolean
  imageUrl: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

export function AvatarCropDialog({ open, imageUrl, onConfirm, onCancel }: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [confirming, setConfirming] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setConfirming(true)
    try {
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels)
      onConfirm(blob)
    } finally {
      setConfirming(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b border-hairline">
          <h3 className="font-semibold text-ink">调整头像</h3>
          <p className="text-xs text-mute mt-0.5">拖动调整位置，滚轮或滑块缩放</p>
        </div>
        <div className="relative w-full" style={{ height: 280 }}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-4 py-2 flex items-center gap-3">
          <span className="text-xs text-mute">缩小</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-mute">放大</span>
        </div>
        <div className="p-4 flex gap-2 justify-end border-t border-hairline">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={confirming}>
            取消
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={confirming}>
            {confirming ? '处理中...' : '确认'}
          </Button>
        </div>
      </div>
    </div>
  )
}
