import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '模型广场 - OPC创业圈',
  description:
    '稳定、低价的国内外 AI 模型中转服务。提供 GPT-4、Claude、Qwen、DeepSeek 等热门模型的 API 接入服务。',
  keywords: [
    'AI模型',
    'GPT-4',
    'Claude',
    'Qwen',
    'DeepSeek',
    'API中转',
    '模型服务',
    'AI接口',
  ],
}

export default function ModelsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
