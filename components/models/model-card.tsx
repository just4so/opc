'use client'

import { useState } from 'react'
import { X, Mail, Zap, Flame } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AIModel, MODEL_TYPES } from '@/constants/models'

interface ModelCardProps {
  model: AIModel
}

export function ModelCard({ model }: ModelCardProps) {
  const [showModal, setShowModal] = useState(false)
  const modelType = MODEL_TYPES.find((t) => t.id === model.type)

  const formatPrice = (price: number) => {
    if (price === 0) return '-'
    if (price < 1) return `¥${price.toFixed(2)}`
    return `¥${price}`
  }

  return (
    <>
      <Card
        className="h-full cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
        onClick={() => setShowModal(true)}
      >
        <CardContent className="pt-6">
          {/* 标题行 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-secondary group-hover:text-primary transition-colors">
                {model.name}
              </h3>
              {model.isHot && (
                <Flame className="h-4 w-4 text-orange-500" />
              )}
            </div>
            {modelType && (
              <Badge
                variant="outline"
                style={{ borderColor: modelType.color, color: modelType.color }}
              >
                {modelType.name}
              </Badge>
            )}
          </div>

          {/* 提供商 */}
          <p className="text-sm text-gray-500 mb-3">{model.provider}</p>

          {/* 描述 */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {model.description}
          </p>

          {/* 价格 */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-500">输入:</span>{' '}
              <span className="font-medium text-primary">
                {formatPrice(model.inputPrice)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">输出:</span>{' '}
              <span className="font-medium text-primary">
                {formatPrice(model.outputPrice)}
              </span>
            </div>
          </div>

          {/* 特性标签 */}
          <div className="flex flex-wrap gap-1.5">
            {model.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 弹窗 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{model.name}</h2>
                  {model.isHot && <Flame className="h-5 w-5 text-orange-500" />}
                </div>
                <p className="text-gray-500">{model.provider}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 模型信息 */}
            <div className="space-y-4 mb-6">
              <p className="text-gray-600">{model.description}</p>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">输入价格</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatPrice(model.inputPrice)}
                    <span className="text-xs text-gray-500 font-normal ml-1">
                      /百万tokens
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">输出价格</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatPrice(model.outputPrice)}
                    <span className="text-xs text-gray-500 font-normal ml-1">
                      /百万tokens
                    </span>
                  </p>
                </div>
              </div>

              {model.contextLength && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4" />
                  <span>上下文长度: {model.contextLength.toLocaleString()} tokens</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {model.features.map((feature, index) => (
                  <Badge key={index} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 联系信息 */}
            <div className="border-t pt-4">
              <p className="text-center text-gray-600 mb-4">
                如需使用此模型，请发送邮件联系
              </p>
              <a href="mailto:luweiliangai@gmail.com?subject=模型广场咨询 - {model.name}">
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  luweiliangai@gmail.com
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
