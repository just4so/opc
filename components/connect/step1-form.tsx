'use client'

import { useRef, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'
import { Step1Data } from './connect-form'

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

interface Step1FormProps {
  form: UseFormReturn<Step1Data>
  cities: string[]
  community: {
    slug: string
    name: string
    city: string
    contactName: string | null
    contactPhone: string | null
    contactWechat: string | null
  } | null
  communities: { name: string; slug: string; city: string }[]
  selectedCommunity: { slug: string; name: string; city: string } | 'recommend' | null
  setSelectedCommunity: (val: { slug: string; name: string; city: string } | 'recommend' | null) => void
  communitySearch: string
  setCommunitySearch: (val: string) => void
  showCommunityDropdown: boolean
  setShowCommunityDropdown: (val: boolean) => void
  communityError: string
  setCommunityError: (val: string) => void
  onSubmit: (data: Step1Data) => void
}

export function Step1Form({
  form,
  cities,
  community,
  communities,
  selectedCommunity,
  setSelectedCommunity,
  communitySearch,
  setCommunitySearch,
  showCommunityDropdown,
  setShowCommunityDropdown,
  communityError,
  setCommunityError,
  onSubmit,
}: Step1FormProps) {
  const comboboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setShowCommunityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setShowCommunityDropdown])

  const filteredCommunities = communities.filter(c => {
    const q = communitySearch.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 tab-content-enter" key="step1">
      <div>
        <Label htmlFor="name">称呼 *</Label>
        <Input
          id="name"
          placeholder="你的称呼"
          className="mt-1.5"
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="contact">手机号（用于社区对接） *</Label>
        <Input
          id="contact"
          placeholder="你的手机号"
          className="mt-1.5"
          {...form.register('contact')}
        />
        {form.formState.errors.contact && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.contact.message}</p>
        )}
      </div>

      <div>
        <Label>城市 *</Label>
        <Select
          value={form.watch('city')}
          onValueChange={(val) => form.setValue('city', val, { shouldValidate: true })}
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
        {form.formState.errors.city && (
          <p className="text-red-500 text-xs mt-1">{form.formState.errors.city.message}</p>
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
  )
}
