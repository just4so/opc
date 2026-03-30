'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TagInput } from '@/components/admin/tag-input'
import { ArrayInput } from '@/components/admin/array-input'
import { LinksInput } from '@/components/admin/links-input'
import { ImageUpload } from '@/components/admin/image-upload'
import { ImagesList } from '@/components/admin/images-list'
import { LocationPickerMap } from '@/components/admin/location-picker-map'
import { CITIES } from '@/constants/cities'
import type { CommunityFormData } from '@/lib/validations/community'
import type { CommunityPolicies } from '@/lib/types/community'

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
  spaceSize: string | null
  workstations: number | null
  focus: string[]
  services: string[]
  suitableFor: string[]
  entryProcess: string[]
  policies: any
  links: any
  coverImage: string | null
  images: string[]
  featured: boolean
  realTips: string[]
  applyDifficulty: number | null
  processTime: string | null
  lastVerifiedAt: Date | string | null
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

type FormData = Omit<CommunityFormData, 'policies'> & { policies: CommunityPolicies }

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
    spaceSize: initialData?.spaceSize || '',
    workstations: initialData?.workstations || null,
    focus: initialData?.focus || [],
    services: initialData?.services || [],
    suitableFor: initialData?.suitableFor || [],
    entryProcess: initialData?.entryProcess || [],
    policies: (initialData?.policies as CommunityPolicies) || {},
    links: Array.isArray(initialData?.links) ? initialData.links : [],
    coverImage: initialData?.coverImage || '',
    images: initialData?.images || [],
    featured: initialData?.featured || false,
    realTips: initialData?.realTips || [],
    applyDifficulty: initialData?.applyDifficulty || null,
    processTime: initialData?.processTime || '',
    lastVerifiedAt: initialData?.lastVerifiedAt
      ? new Date(initialData.lastVerifiedAt).toISOString().split('T')[0]
      : '',
  })

  // Auto-generate slug
  useEffect(() => {
    if (mode === 'create' && formData.city && formData.name) {
      const slug = `${formData.city}-${formData.name}`
        .toLowerCase()
        .replace(/[（）()]/g, '')
        .replace(/\s+/g, '-')
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

      // Sanitize: merge independent description state, filter empty strings,
      // ensure links is always an array (DB might store {} for empty)
      const payload = {
        ...formData,
        description: descriptionRef.current,
        services: formData.services.filter((s) => s.trim()),
        entryProcess: formData.entryProcess.filter((s) => s.trim()),
        realTips: formData.realTips.filter((s) => s.trim()),
        links: (Array.isArray(formData.links) ? formData.links : []).filter(
          (l: { title: string; url: string }) => l.title.trim() || l.url.trim()
        ),
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
                  类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    updateField('type', e.target.value as 'ONLINE' | 'OFFLINE' | 'MIXED')
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="MIXED">综合</option>
                  <option value="ONLINE">线上</option>
                  <option value="OFFLINE">线下</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关注领域
              </label>
              <TagInput
                value={formData.focus}
                onChange={(v) => updateField('focus', v)}
                placeholder="如: AI、大模型、硬件..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                适合人群
              </label>
              <TagInput
                value={formData.suitableFor}
                onChange={(v) => updateField('suitableFor', v)}
                placeholder="如: AI创业者、技术团队..."
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
                  空间面积
                </label>
                <input
                  type="text"
                  value={formData.spaceSize}
                  onChange={(e) => updateField('spaceSize', e.target.value)}
                  placeholder="如: 5000㎡"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工位数
                </label>
                <input
                  type="number"
                  value={formData.workstations || ''}
                  onChange={(e) =>
                    updateField(
                      'workstations',
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
                  联系微信
                </label>
                <input
                  type="text"
                  value={formData.contactWechat}
                  onChange={(e) => updateField('contactWechat', e.target.value)}
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
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
                封面图
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                参考链接
              </label>
              <LinksInput
                value={formData.links || []}
                onChange={(v) => updateField('links', v)}
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
            {/* 入驻政策 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  政策名称
                </label>
                <input
                  type="text"
                  value={(formData.policies as CommunityPolicies).policy_name || ''}
                  onChange={(e) => updateField('policies', { ...formData.policies, policy_name: e.target.value })}
                  placeholder="如：《海淀区关于推动AI产业发展的若干措施》"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  费用/补贴概览
                </label>
                <input
                  type="text"
                  value={(formData.policies as CommunityPolicies).price_range || ''}
                  onChange={(e) => updateField('policies', { ...formData.policies, price_range: e.target.value })}
                  placeholder="如：提供最高3年场地免租"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  支持方向
                </label>
                <input
                  type="text"
                  value={(formData.policies as CommunityPolicies).support_directions || ''}
                  onChange={(e) => updateField('policies', { ...formData.policies, support_directions: e.target.value })}
                  placeholder="如：场地免租、算力补贴、融资支持"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  政策解读
                  <span className="text-xs font-normal text-gray-400 ml-1">（可选）</span>
                </label>
                <textarea
                  rows={3}
                  value={(formData.policies as CommunityPolicies).policy_interpretation || ''}
                  onChange={(e) => updateField('policies', { ...formData.policies, policy_interpretation: e.target.value })}
                  placeholder="简要说明政策背景和实际效果（可选）"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* 分隔 */}
            <div className="border-t border-gray-200" />

            {/* 配套服务与入驻流程 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  入驻流程
                  <span className="text-xs font-normal text-gray-400 ml-1">（按顺序填写，将以步骤形式展示）</span>
                </label>
                <ArrayInput
                  value={formData.entryProcess}
                  onChange={(v) => updateField('entryProcess', v)}
                  placeholder="如：提交申请表"
                  addLabel="添加步骤"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  配套服务
                  <span className="text-xs font-normal text-gray-400 ml-1">（路演场地、法务支持等，将展示在"配套服务"区）</span>
                </label>
                <TagInput
                  value={formData.services}
                  onChange={(v) => updateField('services', v)}
                  placeholder="如: 路演场地、法务支持..."
                />
              </div>
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
                社区简介 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1">（支持 Markdown）</span>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  入驻难度 <span className="text-gray-400 font-normal">（1易-5难）</span>
                </label>
                <StarRating
                  value={formData.applyDifficulty ?? null}
                  onChange={(v) => updateField('applyDifficulty', v)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  实际办理周期
                </label>
                <input
                  type="text"
                  value={formData.processTime}
                  onChange={(e) => updateField('processTime', e.target.value)}
                  placeholder="如：3-4周"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
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
