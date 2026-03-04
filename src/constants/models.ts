export interface AIModel {
  id: string
  name: string
  provider: string
  type: 'text' | 'image' | 'audio' | 'embedding'
  description: string
  inputPrice: number // 元/百万tokens
  outputPrice: number // 元/百万tokens
  features: string[]
  contextLength?: number
  isHot?: boolean
}

export const MODEL_TYPES = [
  { id: 'all', name: '全部', color: '#6B7280' },
  { id: 'text', name: '文本生成', color: '#3B82F6' },
  { id: 'image', name: '图像生成', color: '#8B5CF6' },
  { id: 'audio', name: '语音', color: '#EC4899' },
  { id: 'embedding', name: 'Embedding', color: '#10B981' },
]

export const AI_MODELS: AIModel[] = [
  // OpenAI 模型
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    type: 'text',
    description: '最新旗舰模型，支持文本和图像输入，速度快、性价比高',
    inputPrice: 18,
    outputPrice: 72,
    features: ['多模态', '高性能', '低延迟'],
    contextLength: 128000,
    isHot: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    type: 'text',
    description: '轻量级模型，适合日常对话和简单任务',
    inputPrice: 1.1,
    outputPrice: 4.3,
    features: ['高性价比', '快速响应'],
    contextLength: 128000,
    isHot: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    type: 'text',
    description: '增强版 GPT-4，更长上下文，更新知识库',
    inputPrice: 72,
    outputPrice: 216,
    features: ['长上下文', '高质量'],
    contextLength: 128000,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    type: 'text',
    description: '经典模型，速度快，价格实惠',
    inputPrice: 3.6,
    outputPrice: 7.2,
    features: ['经济实惠', '快速'],
    contextLength: 16385,
  },
  // Anthropic 模型
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    type: 'text',
    description: '智能与速度的最佳平衡，适合复杂任务',
    inputPrice: 21.6,
    outputPrice: 108,
    features: ['高智能', '长上下文', '稳定'],
    contextLength: 200000,
    isHot: true,
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    type: 'text',
    description: '最快的 Claude 模型，适合即时响应场景',
    inputPrice: 1.8,
    outputPrice: 9,
    features: ['极速响应', '高性价比'],
    contextLength: 200000,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    type: 'text',
    description: '最强大的 Claude 模型，适合复杂推理',
    inputPrice: 108,
    outputPrice: 540,
    features: ['最高智能', '深度推理'],
    contextLength: 200000,
  },
  // DeepSeek 模型
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    provider: 'DeepSeek',
    type: 'text',
    description: '国产开源大模型，性能媲美 GPT-4',
    inputPrice: 1,
    outputPrice: 2,
    features: ['开源', '高性价比', '中文优化'],
    contextLength: 64000,
    isHot: true,
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek-R1',
    provider: 'DeepSeek',
    type: 'text',
    description: '推理增强模型，擅长数学和代码',
    inputPrice: 4,
    outputPrice: 16,
    features: ['推理增强', '代码能力强'],
    contextLength: 64000,
    isHot: true,
  },
  // 阿里云模型
  {
    id: 'qwen2.5-72b',
    name: 'Qwen2.5-72B',
    provider: '阿里云',
    type: 'text',
    description: '通义千问旗舰模型，中英文能力出色',
    inputPrice: 4,
    outputPrice: 12,
    features: ['中文优化', '长上下文'],
    contextLength: 131072,
  },
  {
    id: 'qwen2.5-7b',
    name: 'Qwen2.5-7B',
    provider: '阿里云',
    type: 'text',
    description: '轻量级模型，适合边缘部署',
    inputPrice: 0.5,
    outputPrice: 1,
    features: ['轻量', '高性价比'],
    contextLength: 131072,
  },
  // 图像模型
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    type: 'image',
    description: '最新图像生成模型，支持高清图像',
    inputPrice: 0,
    outputPrice: 290, // 按张计费，这里用于展示
    features: ['高清', '风格多样'],
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    provider: 'Stability AI',
    type: 'image',
    description: '开源图像生成模型，高度可定制',
    inputPrice: 0,
    outputPrice: 20,
    features: ['开源', '可定制'],
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    provider: 'Midjourney',
    type: 'image',
    description: '艺术风格图像生成，效果惊艳',
    inputPrice: 0,
    outputPrice: 100,
    features: ['艺术风格', '高质量'],
    isHot: true,
  },
  // Embedding 模型
  {
    id: 'text-embedding-3-small',
    name: 'text-embedding-3-small',
    provider: 'OpenAI',
    type: 'embedding',
    description: '高效文本向量化模型',
    inputPrice: 0.14,
    outputPrice: 0,
    features: ['高效', '1536维'],
  },
  {
    id: 'text-embedding-3-large',
    name: 'text-embedding-3-large',
    provider: 'OpenAI',
    type: 'embedding',
    description: '高精度文本向量化模型',
    inputPrice: 0.93,
    outputPrice: 0,
    features: ['高精度', '3072维'],
  },
  // 语音模型
  {
    id: 'whisper-1',
    name: 'Whisper',
    provider: 'OpenAI',
    type: 'audio',
    description: '语音转文字模型，支持多语言',
    inputPrice: 43, // 按分钟计费
    outputPrice: 0,
    features: ['多语言', '高准确率'],
  },
  {
    id: 'tts-1',
    name: 'TTS-1',
    provider: 'OpenAI',
    type: 'audio',
    description: '文字转语音模型，自然流畅',
    inputPrice: 108, // 按百万字符
    outputPrice: 0,
    features: ['自然', '多音色'],
  },
]
