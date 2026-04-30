'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TagInput } from '@/components/admin/tag-input'
import { ArrayInput } from '@/components/admin/array-input'
import { ImageUpload } from '@/components/admin/image-upload'
import { ImagesList } from '@/components/admin/images-list'
import { LocationPickerMap } from '@/components/admin/location-picker-map'
import { CITIES } from '@/constants/cities'
import type { CommunityFormData } from '@/lib/validations/community'
import { toEnglishSlug } from '@/lib/slug'

const RichTextEditor = dynamic(
  () => import('@/components/admin/rich-text-editor').then((m) => m.RichTextEditor),
  { ssr: false }
)

function StarRating({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="text-2xl transition-colors leading-none"
        >
          <span className={(hovered ?? value ?? 0) >= star ? 'text-orange-400' : 'text-gray-300'}>
            ★
          </span>
        </button>
      ))}
      <span className="text-sm text-gray-400 ml-2">
        {value ? `${value}/5（点击同星可清除）` : '未设置'}
      </span>
    </div>
  )
}

interface Community {
  id: string
  name: string
  slug: string
  city: string
  district: string | null
  address: string
  description: string
  type: 'ONLINE' | 'OFFLINE' | 'MIXED'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  latitude: number | null
  longitude: number | null
  operator: string | null
  contactName: string | null
  contactWechat: string | null
  contactPhone: string | null
  website: string | null
  coverImage: string | null
  images: string[]
  featured: boolean
  realTips: string[]
  entryFriendly: number | null
  processTime: string | null
  lastVerifiedAt: Date | string | null
  // M2 fields
  transit: string | null
  totalArea: string | null
  totalWorkstations: number | null
  focusTracks: string[]
  amenities: string[]
  contactNote: string | null
  benefits: any
  entryInfo: any
}

interface CommunityFormProps {
  mode: 'create' | 'edit'
  initialData?: Community
}

interface Section {
  id: string
  title: string
  isOpen: boolean
}

type BenefitSection = { summary: string; items: string[] }

type FormData = Omit<CommunityFormData, 'benefits' | 'entryInfo'> & {
  benefits: Record<string, BenefitSection>
  entryInfo: { requirements: string[]; steps: string[]; duration: string }
}

export default function CommunityForm({ mode, initialData }: CommunityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMap, setShowMap] = useState(false)

  // Use ref to avoid re-rendering the whole form on every keystroke
  const descriptionRef = useRef(initialData?.description || '')
  const handleDescriptionChange = useCallback((v: string) => {
    descriptionRef.current = v
  }, [])

  const [sections, setSections] = useState<Section[]>([
    { id: 'identity', title: 'A. 身份信息', isOpen: true },
    { id: 'location', title: 'B. 位置与空间', isOpen: true },
    { id: 'contact', title: 'C. 联系与媒体', isOpen: false },
    { id: 'benefits', title: 'D. 政策与流程', isOpen: false },
    { id: 'realintel', title: 'E. 真实信息', isOpen: false },
  ])

  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    city: initialData?.city || '',
    district: initialData?.district || '',
    address: initialData?.address || '',
    description: initialData?.description || '',
    type: initialData?.type || 'MIXED',
    status: initialData?.status || 'ACTIVE',
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null,
    operator: initialData?.operator || '',
    contactName: initialData?.contactName || '',
    contactWechat: initialData?.contactWechat || '',
    contactPhone: initialData?.contactPhone || '',
    website: initialData?.website || '',
    coverImage: initialData?.coverImage || '',
    images: initialData?.images || [],
    featured: initialData?.featured || false,
    realTips: initialData?.realTips || [],
    entryFriendly: initialData?.entryFriendly || null,
    processTime: initialData?.processTime || '',
    lastVerifiedAt: initialData?.lastVerifiedAt
      ? new Date(initialData.lastVerifiedAt).toISOString().split('T')[0]
      : '',
    // M2 new fields
    transit: initialData?.transit || '',
    totalArea: initialData?.totalArea || '',
    totalWorkstations: initialData?.totalWorkstations || null,
    focusTracks: initialData?.focusTracks || [],
    amenities: initialData?.amenities || [],
    contactNote: initialData?.contactNote || '',
    benefits: (() => {
      const raw = (initialData?.benefits as any) || {}
      const normalized: Record<string, { summary: string; items: string[] }> = {}
      for (const [k, v] of Object.entries(raw)) {
        const section = v as any
        normalized[k] = { summary: section?.summary || '', items: Array.isArray(section?.items) ? section.items : [] }
      }
      return normalized
    })(),
    entryInfo: (() => {
      const raw = (initialData?.entryInfo as any) || {}
      return {
        requirements: Array.isArray(raw.requirements) ? raw.requirements : [],
        steps: Array.isArray(raw.steps) ? raw.steps : [],
        duration: raw.duration || '',
      }
    })(),
  })

  // Auto-generate slug
  useEffect(() => {
    if (mode === 'create' && formData.city && formData.name) {
      const slug = toEnglishSlug(`${formData.city}-${formData.name}`)
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.city, formData.name, mode])

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isOpen: !s.isOpen } : s))
    )
  }

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url =
        mode === 'create'
          ? '/api/admin/communities'
          : `/api/admin/communities/${initialData?.id}`

      const cleanBenefits: Record<string, BenefitSection> = {}
      for (const [k, v] of Object.entries(formData.benefits)) {
        const items = Array.isArray(v.items) ? v.items : []
        if (v.summary.trim() || items.some((i: string) => i.trim())) {
          cleanBenefits[k] = { summary: v.summary, items: items.filter((i: string) => i.trim()) }
        }
      }
      const payload = {
        ...formData,
        description: descriptionRef.current,
        transit: formData.transit || null,
        totalArea: formData.totalArea || '',
        totalWorkstations: formData.totalWorkstations,
        focusTracks: formData.focusTracks,
        amenities: formData.amenities,
        contactNote: formData.contactNote || '',
        benefits: cleanBenefits,
        entryInfo: {
          requirements: (Array.isArray(formData.entryInfo?.requirements) ? formData.entryInfo.requirements : []).filter((s) => s.trim()),
          steps: (Array.isArray(formData.entryInfo?.steps) ? formData.entryInfo.steps : []).filter((s) => s.trim()),
          duration: formData.entryInfo?.duration || '',
        },
        realTips: (Array.isArray(formData.realTips) ? formData.realTips : []).filter((s) => s.trim()),
      }

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }

      router.push('/admin/communities')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderSectionHeader = (section: Section) => (
    <button
      type="button"
      onClick={() => toggleSection(section.id)}
      className="w-full flex items-center justify-between py-3 text-left"
    >
      <span className="font-medium text-gray-900">{section.title}</span>
      {section.isOpen ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* A. 身份信息 */}
      <Card>
        <CardHeader className="py-0 border-b">
          {renderSectionHeader(sections[0])}
        </CardHeader>
        {sections[0].isOpen && (
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  社区名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug {mode === 'create' && <span className="text-red-500">*</span>}
                  {mode === 'edit' && <span className="text-xs text-gray-400 ml-1">（系统生成，不可修改）</span>}
                </label>
                {mode === 'edit' ? (
                  <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-gray-500 text-sm font-mono">
                    {formData.slug}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  城市 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  <option value="">选择城市</option>
                  {CITIES.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  区/县
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => updateField('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    updateField('type', e.target.value as 'ONLINE' | 'OFFLINE' | 'MIXED')
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  <option value="MIXED">综合</option>
                  <option value="ONLINE">线上</option>
                  <option value="OFFLINE">线下</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                重点赛道
              </label>
              <TagInput
                value={formData.focusTracks}
                onChange={(v) => updateField('focusTracks', v)}
                placeholder="如: AI、大模型、硬件..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    updateField(
                      'status',
                      e.target.value as 'ACTIVE' | 'INACTIVE' | 'PENDING'
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="ACTIVE">运营中</option>
                  <option value="PENDING">待审核</option>
                  <option value="INACTIVE">已停用</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => updateField('featured', e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">
                  设为推荐
                </label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* B. 位置与空间 */}
      <Card>
        <CardHeader className="py-0 border-b">
          {renderSectionHeader(sections[1])}
        </CardHeader>
        {sections[1].isOpen && (
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                详细地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                交通信息
              </label>
              <input
                type="text"
                value={formData.transit || ''}
                onChange={(e) => updateField('transit', e.target.value)}
                placeholder="如: 地铁4号线XX站步行5分钟"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  地图选点
                </label>
                <div className="flex items-center gap-3">
                  {formData.latitude && formData.longitude && (
                    <span className="text-xs text-gray-500">
                      已设置：{formData.longitude.toFixed(5)}, {formData.latitude.toFixed(5)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMap((v) => !v)}
                    className="text-sm text-primary hover:underline"
                  >
                    {showMap ? '隐藏地图' : '显示地图'}
                  </button>
                </div>
              </div>
              {showMap && (
                <LocationPickerMap
                  city={formData.city}
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={(loc) => {
                    updateField('latitude', loc.latitude)
                    updateField('longitude', loc.longitude)
                  }}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  总面积
                </label>
                <input
                  type="text"
                  value={formData.totalArea || ''}
                  onChange={(e) => updateField('totalArea', e.target.value)}
                  placeholder="如: 3000㎡ 或 最小5㎡/工位"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  总工位数
                </label>
                <input
                  type="number"
                  value={formData.totalWorkstations || ''}
                  onChange={(e) =>
                    updateField(
                      'totalWorkstations',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* C. 联系与媒体 */}
      <Card>
        <CardHeader className="py-0 border-b">
          {renderSectionHeader(sections[2])}
        </CardHeader>
        {sections[2].isOpen && (
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">前台访问地址</label>
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-500">
                <span className="flex-1 font-mono truncate">
                  {formData.slug
                    ? `https://www.opcquan.com/communities/${formData.slug}`
                    : '保存后自动生成'}
                </span>
                {formData.slug && (
                  <a
                    href={`https://www.opcquan.com/communities/${formData.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs"
                  >
                    预览 ↗
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  运营主体
                </label>
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) => updateField('operator', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系人
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => updateField('contactName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  公众号 / 微信号
                </label>
                <input
                  type="text"
                  value={formData.contactWechat}
                  onChange={(e) => updateField('contactWechat', e.target.value)}
                  placeholder="如：公众号名称或微信号"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder="如：400-xxx-xxxx"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系备注
              </label>
              <input
                type="text"
                value={formData.contactNote || ''}
                onChange={(e) => updateField('contactNote', e.target.value)}
                placeholder="如: 工作日9:00-18:00，加微信备注OPC入驻"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                官网
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                封面图 <span className="text-red-500">*</span>
              </label>
              <ImageUpload
                value={formData.coverImage || null}
                onChange={(url) => updateField('coverImage', url)}
                label="封面图"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片集
              </label>
              <ImagesList
                value={formData.images}
                onChange={(urls) => updateField('images', urls)}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* D. 政策与流程 */}
      <Card>
        <CardHeader className="py-0 border-b">
          {renderSectionHeader(sections[3])}
        </CardHeader>
        {sections[3].isOpen && (
          <CardContent className="pt-6 space-y-6">
            {/* 五大政策福利 */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">五大政策福利</p>
              {(
                [
                  { key: 'office', label: '办公空间' },
                  { key: 'compute', label: '算力资源' },
                  { key: 'business', label: '业务拓展' },
                  { key: 'funding', label: '资金支持' },
                  { key: 'housing', label: '安居保障' },
                ] as { key: string; label: string }[]
              ).map(({ key, label }) => {
                const section: BenefitSection = formData.benefits[key] || { summary: '', items: [] }
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">一句话概括</label>
                      <input
                        type="text"
                        value={section.summary}
                        onChange={(e) =>
                          updateField('benefits', {
                            ...formData.benefits,
                            [key]: { ...section, summary: e.target.value },
                          })
                        }
                        placeholder={`${label}政策一句话概括`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">具体条款</label>
                      <ArrayInput
                        value={section.items}
                        onChange={(v) =>
                          updateField('benefits', {
                            ...formData.benefits,
                            [key]: { ...section, items: v },
                          })
                        }
                        placeholder="如: 免租3年"
                        addLabel="添加条款"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 分隔 */}
            <div className="border-t border-gray-200" />

            {/* 入驻信息 */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">入驻信息</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">入驻条件</label>
                <ArrayInput
                  value={formData.entryInfo.requirements}
                  onChange={(v) =>
                    updateField('entryInfo', { ...formData.entryInfo, requirements: v })
                  }
                  placeholder="如: 需提供订单佐证"
                  addLabel="添加条件"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">申请流程</label>
                <ArrayInput
                  value={formData.entryInfo.steps}
                  onChange={(v) =>
                    updateField('entryInfo', { ...formData.entryInfo, steps: v })
                  }
                  placeholder="如: 提交BP"
                  addLabel="添加步骤"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">审核周期</label>
                <input
                  type="text"
                  value={formData.entryInfo.duration}
                  onChange={(e) =>
                    updateField('entryInfo', { ...formData.entryInfo, duration: e.target.value })
                  }
                  placeholder="如: 10-15个工作日"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* 分隔 */}
            <div className="border-t border-gray-200" />

            {/* 配套服务 */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">配套服务</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['会议室', '活动空间', '直播间', '影棚', '3D打印', '前台/行政', '打印复印', '餐饮', '停车', '24小时开放', '工商注册协助', '法务支持', '财税服务', '融资/投资对接', '招聘支持'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (!formData.amenities.includes(item)) {
                        updateField('amenities', [...formData.amenities, item])
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      formData.amenities.includes(item)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <TagInput
                value={formData.amenities}
                onChange={(v) => updateField('amenities', v)}
                placeholder="输入自定义配套服务后按回车"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* E. 真实信息 */}
      <Card>
        <CardHeader className="py-0 border-b">
          {renderSectionHeader(sections[4])}
        </CardHeader>
        {sections[4].isOpen && (
          <CardContent className="pt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                社区详情 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1">（支持富文本）</span>
              </label>
              <div data-color-mode="light">
                <RichTextEditor
                  value={initialData?.description || ''}
                  onChange={handleDescriptionChange}
                  placeholder="社区详细介绍..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                真实入驻提示
              </label>
              <ArrayInput
                value={formData.realTips}
                onChange={(v) => updateField('realTips', v)}
                placeholder="真实入驻提示"
                addLabel="添加"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  入驻友好度 <span className="text-gray-400 font-normal">（1低-5高）</span>
                </label>
                <div className="space-y-1">
                  <StarRating
                    value={formData.entryFriendly ?? null}
                    onChange={(v) => updateField('entryFriendly', v)}
                  />
                  <p className="text-xs text-gray-400">星级越高代表入驻越容易</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  信息核实日期
                </label>
                <input
                  type="date"
                  value={formData.lastVerifiedAt ?? ''}
                  onChange={(e) =>
                    updateField('lastVerifiedAt', e.target.value || null)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/communities')}
        >
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {mode === 'create' ? '创建社区' : '保存修改'}
        </Button>
      </div>
    </form>
  )
}
