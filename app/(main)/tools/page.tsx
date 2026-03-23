'use client'

import { useState } from 'react'
import { TOOLS, TOOL_CATEGORIES } from '@/constants/tools'
import type { Tool } from '@/constants/tools'

export default function ToolsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('build')

  const filteredTools = TOOLS.filter((t) => t.category === activeCategory)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 顶部标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary">OPC创业者工具箱</h1>
        <p className="mt-2 text-gray-500">按场景精选，标注国内可用性</p>
      </div>

      {/* 分类 Tab */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-8 scrollbar-hide">
        {TOOL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-primary text-white shadow-soft'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 工具卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  )
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-5 rounded-xl border border-gray-100 bg-white card-hover transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-lg font-semibold text-secondary">{tool.name}</h3>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
            tool.domesticAvailable
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}
        >
          {tool.domesticAvailable ? '✅ 国内可用' : '⚠️ 需代理'}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-3">{tool.description}</p>

      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            tool.pricingFree
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {tool.pricing}
        </span>
      </div>

      <p className="text-xs text-primary font-medium">💡 {tool.opcUsage}</p>
    </a>
  )
}
