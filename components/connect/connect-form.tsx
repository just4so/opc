'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Copy, Check, ArrowRight } from 'lucide-react'

interface ConnectFormProps {
  community: {
    slug: string
    name: string
    contactName: string | null
    contactPhone: string | null
    contactWechat: string | null
  }
  user: {
    name: string
    contact: string
    location: string
    mainTrack: string
    startupStage: string
  }
  cities: string[]
}

const step1Schema = z.object({
  name: z.string().min(1, '请填写称呼'),
  contact: z.string().min(1, '请填写联系方式'),
  city: z.string().min(1, '请选择城市'),
})

const step2Schema = z.object({
  introduction: z.string().optional(),
  stage: z.string().optional(),
  wantCard: z.boolean().optional(),
  wantVerify: z.boolean().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

type SuccessData = {
  communityContact: { name?: string; phone?: string; wechat?: string } | null
}

export function ConnectForm({ community, user, cities }: ConnectFormProps) {
  const [step, setStep] = useState<'step1' | 'step2' | 'success'>('step1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<SuccessData | null>(null)
  const [copied, setCopied] = useState(false)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)

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
      introduction: user.mainTrack,
      stage: user.startupStage,
      wantCard: false,
      wantVerify: false,
    },
  })

  function handleStep1(data: Step1Data) {
    setStep1Data(data)
    setStep('step2')
  }

  async function submitInquiry(step2Data?: Step2Data) {
    if (!step1Data) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communitySlug: community.slug,
          name: step1Data.name,
          contact: step1Data.contact,
          city: step1Data.city,
          introduction: step2Data?.introduction || undefined,
          stage: step2Data?.stage || undefined,
          wantCard: step2Data?.wantCard || false,
          wantVerify: step2Data?.wantVerify || false,
          source: window.location.href,
        }),
      })

      const data = await res.json()

      if (res.status === 409) {
        setError(data.error || '你已提交过该社区的对接意向')
        if (data.communityContact) {
          setSuccessData({ communityContact: data.communityContact })
          setStep('success')
        }
        return
      }

      if (!res.ok) {
        setError(data.error || '提交失败，请重试')
        return
      }

      setSuccessData({ communityContact: data.communityContact })
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

  async function handleSkip() {
    await submitInquiry()
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'success') {
    const contact = successData?.communityContact
    return (
      <div className="w-full max-w-lg mx-auto bg-canvas rounded-2xl shadow-soft p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-secondary mb-2">提交成功！</h2>
          <p className="text-sm text-mute">我们会尽快帮你对接 {community.name}</p>
        </div>

        {contact && (contact.name || contact.phone || contact.wechat) && (
          <div className="bg-surface-soft rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-secondary mb-3">社区联系方式</h3>
            <div className="space-y-2 text-sm text-body">
              {contact.name && <p>联系人：{contact.name}</p>}
              {contact.phone && <p>电话：{contact.phone}</p>}
              {contact.wechat && <p>公众号：{contact.wechat}</p>}
            </div>
          </div>
        )}

        <div className="bg-orange-50 rounded-xl p-5 mb-6">
          <p className="text-sm font-medium text-orange-800 mb-2">急需对接？添加微信号：</p>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-orange-900">opcquan01</span>
            <button
              onClick={() => handleCopy('opcquan01')}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/plaza"
            className="flex items-center justify-between w-full px-4 py-3 bg-surface-soft rounded-xl text-sm text-secondary hover:bg-surface-card transition-colors"
          >
            <span>去创业广场看看</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/communities"
            className="flex items-center justify-between w-full px-4 py-3 bg-surface-soft rounded-xl text-sm text-secondary hover:bg-surface-card transition-colors"
          >
            <span>浏览更多社区</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-canvas rounded-2xl shadow-soft p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-secondary mb-1">社区直通车</h2>
        <p className="text-sm text-mute">提交意向，专人帮你对接 {community.name}</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        <div className={`flex-1 h-1 rounded-full ${step === 'step1' ? 'bg-primary' : 'bg-primary'}`} />
        <div className={`flex-1 h-1 rounded-full ${step === 'step2' ? 'bg-primary' : 'bg-gray-200'}`} />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {step === 'step1' && (
        <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-5">
          <div>
            <Label htmlFor="name">称呼 *</Label>
            <Input
              id="name"
              placeholder="你的称呼"
              className="mt-1.5"
              {...form1.register('name')}
            />
            {form1.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{form1.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="contact">联系方式 *</Label>
            <Input
              id="contact"
              placeholder="手机号或微信号"
              className="mt-1.5"
              {...form1.register('contact')}
            />
            {form1.formState.errors.contact && (
              <p className="text-red-500 text-xs mt-1">{form1.formState.errors.contact.message}</p>
            )}
          </div>

          <div>
            <Label>城市 *</Label>
            <Select
              value={form1.watch('city')}
              onValueChange={(val) => form1.setValue('city', val, { shouldValidate: true })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="选择城市" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form1.formState.errors.city && (
              <p className="text-red-500 text-xs mt-1">{form1.formState.errors.city.message}</p>
            )}
          </div>

          <div>
            <Label>意向社区</Label>
            <Input
              value={community.name}
              disabled
              className="mt-1.5 bg-gray-50"
            />
          </div>

          <Button type="submit" className="w-full">
            下一步
          </Button>
        </form>
      )}

      {step === 'step2' && (
        <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-5">
          <div>
            <Label htmlFor="introduction">方向（选填）</Label>
            <Input
              id="introduction"
              placeholder="你在做什么方向"
              className="mt-1.5"
              {...form2.register('introduction')}
            />
          </div>

          <div>
            <Label>阶段（选填）</Label>
            <Select
              value={form2.watch('stage') || ''}
              onValueChange={(val) => form2.setValue('stage', val)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="选择阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="还在想">还在想</SelectItem>
                <SelectItem value="已注册公司">已注册公司</SelectItem>
                <SelectItem value="已有收入">已有收入</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Checkbox
                id="wantCard"
                checked={form2.watch('wantCard') || false}
                onCheckedChange={(checked) => form2.setValue('wantCard', checked === true)}
              />
              <Label htmlFor="wantCard" className="text-sm font-normal leading-snug cursor-pointer">
                展示在创业者广场
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="wantVerify"
                checked={form2.watch('wantVerify') || false}
                onCheckedChange={(checked) => form2.setValue('wantVerify', checked === true)}
              />
              <Label htmlFor="wantVerify" className="text-sm font-normal leading-snug cursor-pointer">
                申请认证
              </Label>
            </div>
          </div>

          <div>
            <Button type="button" variant="outline" disabled className="w-full opacity-50">
              上传 BP（即将开放）
            </Button>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? '提交中...' : '提交'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={handleSkip}
              className="flex-1"
            >
              跳过，先提交基本信息
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
