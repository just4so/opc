'use client'

import { useState, useRef, useEffect } from 'react'
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, ArrowRight, X, Upload, Loader2 } from 'lucide-react'

interface ConnectFormProps {
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

const step1Schema = z.object({
  name: z.string().min(1, '请填写称呼'),
  contact: z.string().min(1, '请填写联系方式'),
  city: z.string().min(1, '请选择城市'),
})

const step2Schema = z.object({
  bio: z.string().min(1, '请填写你在做什么').max(200),
  productName: z.string().max(100).optional(),
  productTagline: z.string().max(300).optional(),
  productStage: z.string().optional(),
  productWebsite: z.string().max(200).optional(),
  showInPlaza: z.boolean().optional(),
  acceptInterview: z.boolean().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

const CITY_PINYIN_INITIAL: Record<string, string> = {
  '安庆': 'A', '鞍山': 'A',
  '北京': 'B', '保定': 'B', '宝鸡': 'B',
  '成都': 'C', '常州': 'C', '长沙': 'C', '长春': 'C', '重庆': 'C', '常熟': 'C',
  '大连': 'D', '大同': 'D', '东莞': 'D',
  '佛山': 'F', '福州': 'F',
  '广州': 'G', '贵阳': 'G', '桂林': 'G',
  '哈尔滨': 'H', '哈密': 'H', '海口': 'H', '合肥': 'H', '杭州': 'H', '呼和浩特': 'H', '湖州': 'H', '惠州': 'H', '海宁': 'H',
  '济南': 'J', '嘉兴': 'J', '金华': 'J',
  '昆明': 'K', '昆山': 'K',
  '兰州': 'L', '连云港': 'L', '柳州': 'L',
  '马鞍山': 'M',
  '南京': 'N', '南宁': 'N', '南通': 'N', '南昌': 'N', '宁波': 'N',
  '青岛': 'Q', '泉州': 'Q',
  '沈阳': 'S', '深圳': 'S', '石家庄': 'S', '苏州': 'S', '宿迁': 'S', '绍兴': 'S',
  '太原': 'T', '天津': 'T',
  '温州': 'W', '武汉': 'W', '无锡': 'W', '芜湖': 'W',
  '厦门': 'X', '西安': 'X', '徐州': 'X', '襄阳': 'X',
  '扬州': 'Y', '烟台': 'Y', '义乌': 'Y', '玉林': 'Y',
  '郑州': 'Z', '中山': 'Z', '珠海': 'Z', '漳州': 'Z',
}

function groupCitiesByInitial(cities: string[]) {
  const groups: Record<string, string[]> = {}
  const other: string[] = []
  for (const city of cities) {
    const initial = CITY_PINYIN_INITIAL[city]
    if (initial) {
      if (!groups[initial]) groups[initial] = []
      groups[initial].push(city)
    } else {
      other.push(city)
    }
  }
  const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  if (other.length > 0) sorted.push(['其他', other])
  return sorted
}

export function ConnectForm({ community, user, cities, communities = [] }: ConnectFormProps) {
  const [step, setStep] = useState<'step1' | 'step2' | 'success'>('step1')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)

  const [selectedCommunity, setSelectedCommunity] = useState<{ slug: string; name: string; city: string } | 'recommend' | null>(null)
  const [communitySearch, setCommunitySearch] = useState('')
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false)
  const [communityError, setCommunityError] = useState('')
  const comboboxRef = useRef<HTMLDivElement>(null)

  const [bpFile, setBpFile] = useState<{ url: string; filename: string } | null>(null)
  const [bpUploading, setBpUploading] = useState(false)
  const [bpError, setBpError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [qrcodeUrl, setQrcodeUrl] = useState<string | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowCommunityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (step === 'success') {
      fetch('/api/settings/qrcode?key=connect_qrcode_url')
        .then((res) => res.json())
        .then((data) => { if (data.url) setQrcodeUrl(data.url) })
        .catch(() => {})
    }
  }, [step])

  const filteredCommunities = communities.filter(c => {
    const q = communitySearch.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
  })

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
      productTagline: '',
      productStage: '',
      productWebsite: '',
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
          productTagline: step2Data?.productTagline || undefined,
          productStage: step2Data?.productStage || undefined,
          productWebsite: step2Data?.productWebsite || undefined,
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
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (step === 'success') {
    return (
      <div className="w-full max-w-lg mx-auto bg-canvas rounded-2xl shadow-soft p-8">
        <div className="text-center mb-6">
          <div className="success-check-animate inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">资料已提交</h2>
          <p className="text-sm text-mute">OPC圈将在 1 个工作日内审核，审核通过后将直接推荐给社区</p>
        </div>

        <div className="bg-surface-soft rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-ink mb-3">添加 OPC圈 客服，第一时间获取审核结果</p>
          <div className="flex items-center justify-center">
            {qrcodeUrl ? (
              <img src={qrcodeUrl} alt="OPC圈客服二维码" className="w-[200px] h-[200px] rounded-xl object-contain" />
            ) : (
              <div className="w-[200px] h-[200px] bg-surface-card rounded-xl flex items-center justify-center text-sm text-mute">
                请在后台上传二维码
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 opacity-0 animate-[fadeInUp_400ms_ease-out_600ms_forwards]">
          <Link
            href="/plaza"
            className="flex items-center justify-between w-full px-4 py-3 bg-surface-soft rounded-xl text-sm text-ink hover:bg-surface-card transition-colors"
          >
            <span>去广场看看其他创业者</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/settings#card"
            className="flex items-center justify-between w-full px-4 py-3 bg-surface-soft rounded-xl text-sm text-ink hover:bg-surface-card transition-colors"
          >
            <span>完善你的创业者卡片</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
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
        <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-5 tab-content-enter" key="step1">
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
            <Label htmlFor="contact">手机号（用于社区对接） *</Label>
            <Input
              id="contact"
              placeholder="你的手机号"
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
                {groupCitiesByInitial(cities).map(([letter, citiesInGroup]) => (
                  <SelectGroup key={letter}>
                    <SelectLabel>{letter}</SelectLabel>
                    {citiesInGroup.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {form1.formState.errors.city && (
              <p className="text-red-500 text-xs mt-1">{form1.formState.errors.city.message}</p>
            )}
          </div>

          {community ? (
            <div>
              <Label>意向社区</Label>
              <Input
                value={`${community.name} · ${community.city}`}
                disabled
                className="mt-1.5 bg-surface-soft"
              />
            </div>
          ) : (
            <div>
              <Label>意向社区 *</Label>
              <div className="relative mt-1.5" ref={comboboxRef}>
                {selectedCommunity ? (
                  <div className="flex items-center justify-between border border-input rounded-md h-10 px-3 bg-background text-sm">
                    <span>
                      {selectedCommunity === 'recommend' ? '不确定，帮我推荐' : `${selectedCommunity.name} · ${selectedCommunity.city}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedCommunity(null)}
                      className="text-ash hover:text-mute transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Input
                    placeholder="搜索社区..."
                    value={communitySearch}
                    onChange={(e) => {
                      setCommunitySearch(e.target.value)
                      setShowCommunityDropdown(true)
                    }}
                    onFocus={() => setShowCommunityDropdown(true)}
                  />
                )}
                {showCommunityDropdown && !selectedCommunity && (
                  <div className="absolute z-50 w-full mt-1 bg-canvas border border-hairline rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCommunity('recommend')
                        setShowCommunityDropdown(false)
                        setCommunitySearch('')
                        setCommunityError('')
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-sm text-primary font-medium hover:bg-surface-soft border-b border-hairline-soft"
                    >
                      不确定，帮我推荐
                    </button>
                    {filteredCommunities.map((c) => (
                      <button
                        type="button"
                        key={c.slug}
                        onClick={() => {
                          setSelectedCommunity(c)
                          setShowCommunityDropdown(false)
                          setCommunitySearch('')
                          setCommunityError('')
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-sm text-body hover:bg-surface-soft"
                      >
                        {c.name} · {c.city}
                      </button>
                    ))}
                    {filteredCommunities.length === 0 && communitySearch && (
                      <div className="px-3.5 py-2.5 text-sm text-ash">未找到匹配的社区</div>
                    )}
                  </div>
                )}
              </div>
              {communityError && (
                <p className="text-red-500 text-xs mt-1">{communityError}</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full">
            下一步
          </Button>
        </form>
      )}

      {step === 'step2' && (
        <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-5 tab-content-enter" key="step2">
          <div>
            <Label htmlFor="bio">你在做什么 *</Label>
            <textarea
              id="bio"
              placeholder="例：独立开发AI写作工具，已上线3个月"
              maxLength={200}
              rows={2}
              className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              {...form2.register('bio')}
            />
            <p className="text-xs text-mute mt-1">{form2.watch('bio')?.length || 0}/200</p>
            {form2.formState.errors.bio && (
              <p className="text-red-500 text-xs mt-1">{form2.formState.errors.bio.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="productName">产品/服务名称</Label>
            <Input
              id="productName"
              placeholder="你的产品或服务名称"
              className="mt-1.5"
              {...form2.register('productName')}
            />
          </div>

          <div>
            <Label htmlFor="productTagline">简单描述你的产品或服务</Label>
            <Input
              id="productTagline"
              placeholder="你在做什么，解决谁的问题，现在到了哪个阶段"
              maxLength={300}
              className="mt-1.5"
              {...form2.register('productTagline')}
            />
          </div>

          <div>
            <Label>产品阶段</Label>
            <Select
              value={form2.watch('productStage') || ''}
              onValueChange={(val) => form2.setValue('productStage', val)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="选择产品阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="想法阶段">想法阶段</SelectItem>
                <SelectItem value="开发中">开发中</SelectItem>
                <SelectItem value="已上线">已上线</SelectItem>
                <SelectItem value="有收入">有收入</SelectItem>
                <SelectItem value="已盈利">已盈利</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="productWebsite">产品网站</Label>
            <Input
              id="productWebsite"
              placeholder="https://"
              className="mt-1.5"
              {...form2.register('productWebsite')}
            />
          </div>

          <div>
            <Label>BP / 公司介绍（选填）</Label>
            <p className="text-xs text-mute mt-0.5 mb-2">上传 BP 或公司介绍，可大幅提高推荐成功率</p>
            {bpFile ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-md bg-surface-soft text-sm">
                <Upload className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate flex-1">{bpFile.filename}</span>
                <button
                  type="button"
                  onClick={() => setBpFile(null)}
                  className="text-ash hover:text-mute transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  onChange={handleBpUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={bpUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  {bpUploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上传中...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" />选择文件（PDF/DOC/PPT，最大 10MB）</>
                  )}
                </Button>
              </div>
            )}
            {bpError && <p className="text-red-500 text-xs mt-1">{bpError}</p>}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="showInPlaza"
              checked={form2.watch('showInPlaza') ?? true}
              onCheckedChange={(checked) => form2.setValue('showInPlaza', checked === true)}
            />
            <Label htmlFor="showInPlaza" className="text-sm font-normal leading-snug cursor-pointer">
              同时展示在创业者广场
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="acceptInterview"
              checked={form2.watch('acceptInterview')}
              onCheckedChange={(val) => form2.setValue('acceptInterview', !!val)}
            />
            <div>
              <Label htmlFor="acceptInterview" className="cursor-pointer">
                愿意接受官方媒体采访或宣传报道
              </Label>
              <p className="text-xs text-mute mt-0.5">
                OPC圈会不定期推荐优质创业者故事，勾选后有机会获得曝光
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('step1')}
              className="flex-shrink-0"
            >
              上一步
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? '提交中...' : '提交'}
            </Button>
          </div>

        </form>
      )}
    </div>
  )
}
