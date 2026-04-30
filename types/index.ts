// 社区类型
export interface Community {
  id: string
  slug: string
  name: string
  city: string
  district?: string
  address: string
  latitude?: number
  longitude?: number
  description: string
  type: 'ONLINE' | 'OFFLINE' | 'MIXED'
  focus: string[]
  operator?: string
  contactName?: string
  contactWechat?: string
  contactPhone?: string
  website?: string
  spaceSize?: string
  workstations?: number
  policies?: CommunityPolicies
  entryProcess: string[]
  amenities: string[]
  notes: string[]
  links?: CommunityLink[]
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  featured: boolean
  coverImage?: string
  images: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CommunityPolicies {
  spaceSubsidy?: {
    rentDiscount?: string
    spaceSize?: string
    details?: string[]
  }
  computeSubsidy?: {
    maxAmount?: string
    details?: string[]
  }
  vouchers?: {
    type: string
    maxAmount: string
  }[]
  funding?: {
    startupFund?: string
    equity?: boolean
    details?: string[]
  }
  other?: string[]
}

export interface CommunityLink {
  title: string
  url: string
}

// 用户类型
export interface User {
  id: string
  username: string
  email?: string
  phone?: string
  name?: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  wechat?: string
  role: 'USER' | 'ADMIN' | 'MODERATOR'
  level: number
  verified: boolean
  verifyType?: 'IDENTITY' | 'ENTREPRENEUR' | 'EXPERT' | 'COMMUNITY'
  skills: string[]
  canOffer: string[]
  lookingFor: string[]
  createdAt: Date
  updatedAt: Date
}

// 动态类型
export interface Post {
  id: string
  content: string
  images: string[]
  type: 'DAILY' | 'EXPERIENCE' | 'QUESTION' | 'RESOURCE' | 'DISCUSSION'
  topics: string[]
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DELETED'
  pinned: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  authorId: string
  author?: User
  createdAt: Date
  updatedAt: Date
}

// 项目类型
export interface Project {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  logo?: string
  coverImage?: string
  screenshots: string[]
  category: string[]
  techStack: string[]
  stage: 'IDEA' | 'BUILDING' | 'LAUNCHED' | 'REVENUE' | 'PROFITABLE'
  mrr?: number
  userCount?: number
  isRevenuePublic: boolean
  website?: string
  github?: string
  productHunt?: string
  appStore?: string
  playStore?: string
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'ARCHIVED'
  featured: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  ownerId: string
  owner?: User
  launchedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// API响应类型
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
