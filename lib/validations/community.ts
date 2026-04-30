import { z } from 'zod'

export const communityFormSchema = z.object({
  // 基本信息
  name: z.string().min(1, '请输入社区名称'),
  slug: z
    .string()
    .min(1, '请输入 slug')
    .regex(/^[a-z0-9\u4e00-\u9fa5-]+$/i, 'slug 只能包含字母、数字、中文和连字符'),
  city: z.string().min(1, '请选择城市'),
  district: z.string().optional().default(''),
  address: z.string().min(1, '请输入详细地址'),
  description: z.string().min(10, '描述至少10个字符'),
  type: z.enum(['ONLINE', 'OFFLINE', 'MIXED']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),

  // 位置
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),

  // 运营信息
  operator: z.string().optional().default(''),
  contactName: z.string().optional().default(''),
  contactWechat: z.string().optional().default(''),
  contactPhone: z.string().optional().default(''),
  website: z.string().optional().default(''),

  // 图片
  coverImage: z.string().optional().default(''),
  images: z.array(z.string()).default([]),

  // 真实入驻信息
  realTips: z.array(z.string()).default([]),
  entryFriendly: z.number().int().min(1).max(5).optional().nullable(),
  processTime: z.string().optional().default(''),
  lastVerifiedAt: z.string().optional().nullable(),

  // 推荐
  featured: z.boolean().default(false),

  // M2 新增字段
  transit: z.string().optional().nullable(),
  totalArea: z.string().optional().default(''),
  totalWorkstations: z.number().int().positive().optional().nullable(),
  focusTracks: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  contactNote: z.string().optional().default(''),
  benefits: z.record(z.string(), z.any()).optional().nullable(),
  entryInfo: z.record(z.string(), z.any()).optional().nullable(),
})

export type CommunityFormData = z.infer<typeof communityFormSchema>

// 用于创建时的 schema（部分字段必填）
export const communityCreateSchema = communityFormSchema

// 用于更新时的 schema（所有字段可选）
export const communityUpdateSchema = communityFormSchema.partial()
