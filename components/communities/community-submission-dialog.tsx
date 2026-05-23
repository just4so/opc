'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CommunitySubmissionDialog({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [communityName, setCommunityName] = useState('')
  const [city, setCity] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!communityName.trim() || !city.trim() || !contactInfo.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/community-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityName: communityName.trim(),
          contactName: communityName.trim(),
          contactInfo: contactInfo.trim(),
          city: city.trim(),
          description: description.trim() || undefined,
          type: 'SUBMISSION',
        }),
      })
      if (res.ok) {
        setSuccess(true)
      }
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) {
      setCommunityName('')
      setCity('')
      setContactInfo('')
      setDescription('')
      setSuccess(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>申请收录社区</DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-green-600 font-medium">提交成功，我们会尽快联系您</p>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              关闭
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">社区名称 *</label>
              <Input
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                placeholder="社区全称"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">所在城市 *</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="如：杭州"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">联系方式 *</label>
              <Input
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="手机号或微信"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">补充说明</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="可选，关于该社区的简介"
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !communityName.trim() || !city.trim() || !contactInfo.trim()}>
              {submitting ? '提交中...' : '提交申请'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
