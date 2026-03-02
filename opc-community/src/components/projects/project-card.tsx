import Link from 'next/link'
import { ExternalLink, Github, Heart, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PROJECT_STAGES } from '@/constants/topics'

interface ProjectCardProps {
  project: {
    id: string
    slug: string
    name: string
    tagline: string
    logo?: string | null
    category: string[]
    techStack: string[]
    stage: string
    mrr?: number | null
    userCount?: number | null
    isRevenuePublic: boolean
    website?: string | null
    github?: string | null
    likeCount: number
    commentCount: number
    featured: boolean
    owner: {
      id: string
      username: string
      name?: string | null
      avatar?: string | null
    }
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const stage = PROJECT_STAGES.find(s => s.id === project.stage)

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        {/* 头部：Logo和名称 */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0 overflow-hidden">
            {project.logo ? (
              <img src={project.logo} alt={project.name} className="w-full h-full object-cover" />
            ) : (
              project.name[0]
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link
                href={`/projects/${project.slug}`}
                className="font-semibold text-secondary hover:text-primary transition-colors truncate"
              >
                {project.name}
              </Link>
              {project.featured && (
                <Badge variant="default" className="text-xs">推荐</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {project.tagline}
            </p>
          </div>
        </div>

        {/* 阶段和数据 */}
        <div className="flex items-center justify-between mb-4">
          {stage && (
            <Badge
              variant="outline"
              style={{ borderColor: stage.color, color: stage.color }}
            >
              {stage.name}
            </Badge>
          )}
          {project.isRevenuePublic && project.mrr && (
            <span className="text-sm font-medium text-green-600">
              ${project.mrr}/月
            </span>
          )}
        </div>

        {/* 技术栈 */}
        {project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.techStack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 4 && (
              <span className="px-2 py-0.5 text-gray-400 text-xs">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>
        )}

        {/* 创始人 */}
        <div className="flex items-center text-sm text-gray-500">
          <span>by </span>
          <Link
            href={`/profile/${project.owner.username}`}
            className="ml-1 text-secondary hover:text-primary transition-colors"
          >
            {project.owner.name || project.owner.username}
          </Link>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4 flex items-center justify-between">
        {/* 互动数据 */}
        <div className="flex items-center space-x-4 text-gray-500">
          <span className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span className="text-sm">{project.likeCount}</span>
          </span>
          <span className="flex items-center space-x-1">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{project.commentCount}</span>
          </span>
        </div>

        {/* 链接 */}
        <div className="flex items-center space-x-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          )}
          {project.website && (
            <a
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
