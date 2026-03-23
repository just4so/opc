'use client'

import { useState } from 'react'
import { Cpu, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ModelCard } from '@/components/models/model-card'
import { AI_MODELS, MODEL_TYPES } from '@/constants/models'

export default function ModelsPage() {
  const [selectedType, setSelectedType] = useState('all')

  const filteredModels =
    selectedType === 'all'
      ? AI_MODELS
      : AI_MODELS.filter((model) => model.type === selectedType)

  // 热门模型放前面
  const sortedModels = [...filteredModels].sort((a, b) => {
    if (a.isHot && !b.isHot) return -1
    if (!a.isHot && b.isHot) return 1
    return 0
  })

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-secondary">模型广场</h1>
          </div>
          <p className="text-gray-600 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            稳定、低价的国内外 AI 模型中转服务
          </p>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container mx-auto px-4 py-8">
        {/* 筛选标签 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {MODEL_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedType === type.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              {type.name}
              {type.id !== 'all' && (
                <span className="ml-1.5 text-xs opacity-75">
                  ({AI_MODELS.filter((m) => m.type === type.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 模型网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 p-6 bg-white rounded-lg border text-center">
          <h3 className="text-lg font-semibold mb-2">如何使用？</h3>
          <p className="text-gray-600 mb-4">
            点击任意模型卡片，发送邮件咨询即可获取 API 接入方式和详细价格
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary">稳定</Badge>
              <span>99.9% 可用性保障</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary">低价</Badge>
              <span>比官方价格更优惠</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary">快速</Badge>
              <span>低延迟响应</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
