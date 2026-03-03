import Link from 'next/link'
import { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { ProjectCard } from '@/components/projects/project-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import prisma from '@/lib/db'
import { PROJECT_STAGES, PROJECT_CATEGORIES } from '@/constants/topics'

// ISR: 每5分钟重新生成页面
export const revalidate = 300

export const metadata: Metadata = {
  title: '项目展示 - OPC创业圈',
  description: '发现优秀的一人公司项目，获取灵感、学习经验、寻找合作',
}

interface PageProps {
  searchParams: { stage?: string; category?: string; page?: string }
}

async function getProjects(stage?: string, category?: string, page: number = 1) {
  const limit = 12
  const where: any = {
    status: 'PUBLISHED',
  }

  if (stage) {
    where.stage = stage
  }

  if (category) {
    where.category = { has: category }
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ])

  return {
    projects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const stage = searchParams.stage
  const category = searchParams.category
  const page = parseInt(searchParams.page || '1')
  const { projects, pagination } = await getProjects(stage, category, page)

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">项目展示</h1>
              <p className="text-gray-600">
                发现优秀的一人公司项目，获取灵感、学习经验
              </p>
            </div>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                发布项目
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 筛选栏 */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          {/* 项目阶段 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">项目阶段</h3>
            <div className="flex flex-wrap gap-2">
              <Link href="/projects">
                <Badge
                  variant={!stage ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  全部
                </Badge>
              </Link>
              {PROJECT_STAGES.map((s) => (
                <Link key={s.id} href={`/projects?stage=${s.id}`}>
                  <Badge
                    variant={stage === s.id ? 'default' : 'outline'}
                    className="cursor-pointer"
                    style={stage === s.id ? {} : { borderColor: s.color, color: s.color }}
                  >
                    {s.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* 项目分类 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">项目分类</h3>
            <div className="flex flex-wrap gap-2">
              <Link href={stage ? `/projects?stage=${stage}` : '/projects'}>
                <Badge
                  variant={!category ? 'default' : 'outline'}
                  className="cursor-pointer"
                >
                  全部
                </Badge>
              </Link>
              {PROJECT_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/projects?${stage ? `stage=${stage}&` : ''}category=${c}`}
                >
                  <Badge
                    variant={category === c ? 'default' : 'outline'}
                    className="cursor-pointer"
                  >
                    {c}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 项目网格 */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg">
            <p className="text-gray-500 mb-4">暂无项目</p>
            <Link href="/projects/new">
              <Button>发布第一个项目</Button>
            </Link>
          </div>
        )}

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/projects?${stage ? `stage=${stage}&` : ''}${category ? `category=${category}&` : ''}page=${p}`}
                className={`px-4 py-2 rounded-md text-sm ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
