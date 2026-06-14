'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Step1Form } from './step1-form'
import { Step2Form } from './step2-form'
import { SuccessView } from './success-view'

export interface ConnectFormProps {
  community: {
    slug: string
    name: string
    city: string
    contactName: string | null
    contactPhone: string | null
    contactWechat: string | null
  } | null
  user: {
    name: string
    contact: string
    location: string
    mainTrack: string
    startupStage: string
  }
  cities: string[]
  communities?: { name: string; slug: string; city: string }[]
}

export const step1Schema = z.object({
  name: z.string().min(1, '请填写称呼'),
  contact: z.string().min(1, '请填写联系方式'),
  city: z.string().min(1, '请选择城市'),
})

export const step2Schema = z.object({
  bio: z.string().min(1, '请填写自我简介').max(200),
  productName: z.string().max(100).optional(),
  productDescription: z.string().max(1000).optional(),
  productStage: z.string().optional(),
  productWebsite: z.string().max(200).optional(),
  productImages: z.array(z.string()).max(5).optional(),
  showInPlaza: z.boolean().optional(),
  acceptInterview: z.boolean().optional(),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>

export function ConnectForm({ community, user, cities, communities = [] }: ConnectFormProps) {
  const [step, setStep] = useState<'step1' | 'step2' | 'success'>('step1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)

  const [selectedCommunity, setSelectedCommunity] = useState<{ slug: string; name: string; city: string } | 'recommend' | null>(null)
  const [communitySearch, setCommunitySearch] = useState('')
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false)
  const [communityError, setCommunityError] = useState('')

  const [bpFile, setBpFile] = useState<{ url: string; filename: string } | null>(null)
  const [bpUploading, setBpUploading] = useState(false)
  const [bpError, setBpError] = useState('')
  const [qrcodeUrl, setQrcodeUrl] = useState<string | null>(null)
  const [resultProjectSlug, setResultProjectSlug] = useState<string | null>(null)

  useEffect(() => {
    if (step === 'success') {
      fetch('/api/settings/qrcode?key=connect_qrcode_url')
        .then((res) => res.json())
        .then((data) => { if (data.url) setQrcodeUrl(data.url) })
        .catch(() => {})
    }
  }, [step])

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: user.name,
      contact: user.contact,
      city: user.location,
    },
  })

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      bio: '',
      productName: '',
      productDescription: '',
      productStage: '',
      productWebsite: '',
      productImages: [],
      showInPlaza: true,
      acceptInterview: false,
    },
  })

  function handleStep1(data: Step1Data) {
    if (!community && !selectedCommunity) {
      setCommunityError('请选择意向社区')
      return
    }
    setCommunityError('')
    setStep1Data(data)
    setStep('step2')
  }

  async function submitInquiry(step2Data?: Step2Data) {
    if (!step1Data) return
    setSubmitting(true)
    setError('')

    const communitySlug = community
      ? community.slug
      : selectedCommunity && selectedCommunity !== 'recommend'
        ? selectedCommunity.slug
        : undefined

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communitySlug: communitySlug || undefined,
          name: step1Data.name,
          contact: step1Data.contact,
          city: step1Data.city,
          bio: step2Data?.bio || undefined,
          productName: step2Data?.productName || undefined,
          productDescription: step2Data?.productDescription || undefined,
          productStage: step2Data?.productStage || undefined,
          productWebsite: step2Data?.productWebsite || undefined,
          productImages: step2Data?.productImages?.length ? step2Data.productImages : undefined,
          showInPlaza: step2Data?.showInPlaza ?? true,
          acceptInterview: step2Data?.acceptInterview || false,
          bpUrl: bpFile?.url || undefined,
          bpFilename: bpFile?.filename || undefined,
          source: window.location.href,
        }),
      })

      const data = await res.json()

      if (res.status === 409) {
        setError(data.error || '你已提交过该社区的对接意向')
        if (data.communityContact) {
          setStep('success')
        }
        return
      }

      if (!res.ok) {
        setError(data.error || '提交失败，请重试')
        return
      }

      if (data.projectSlug) {
        setResultProjectSlug(data.projectSlug)
      }

      setStep('success')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStep2(data: Step2Data) {
    await submitInquiry(data)
  }

  async function handleBpUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      setBpError('文件大小不能超过 20MB')
      return
    }
    setBpError('')
    setBpUploading(true)
    try {
      const res = await fetch('/api/upload/bp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '获取上传地址失败')
      }
      const { uploadUrl, publicUrl } = await res.json()
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error('文件上传失败')
      setBpFile({ url: publicUrl, filename: file.name })
    } catch (err) {
      setBpError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setBpUploading(false)
    }
  }

  if (step === 'success') {
    return <SuccessView qrcodeUrl={qrcodeUrl} projectSlug={resultProjectSlug} />
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-canvas rounded-2xl shadow-soft p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-ink mb-1">社区直通车</h2>
        <p className="text-sm text-mute">
          {community
            ? `提交意向，专人帮你对接 ${community.name}`
            : '提交意向，专人帮你对接合适的 OPC 社区'}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-1 rounded-full ${step === 'step1' ? 'bg-primary' : 'bg-primary'}`} />
        <div className={`flex-1 h-1 rounded-full ${step === 'step2' ? 'bg-primary' : 'bg-secondary-bg'}`} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {step === 'step1' && (
        <Step1Form
          form={form1}
          cities={cities}
          community={community}
          communities={communities}
          selectedCommunity={selectedCommunity}
          setSelectedCommunity={setSelectedCommunity}
          communitySearch={communitySearch}
          setCommunitySearch={setCommunitySearch}
          showCommunityDropdown={showCommunityDropdown}
          setShowCommunityDropdown={setShowCommunityDropdown}
          communityError={communityError}
          setCommunityError={setCommunityError}
          onSubmit={handleStep1}
        />
      )}

      {step === 'step2' && (
        <Step2Form
          form={form2}
          submitting={submitting}
          bpFile={bpFile}
          setBpFile={setBpFile}
          bpUploading={bpUploading}
          bpError={bpError}
          onBpUpload={handleBpUpload}
          onBack={() => setStep('step1')}
          onSubmit={handleStep2}
        />
      )}
    </div>
  )
}
