'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Rocket, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import { useToast } from '@/components/ui/toast-notification'
import { ProgressDialog } from './progress-dialog'

const STAGE_OPTIONS = [
  { value: 'IDEA', label: '想法阶段' },
  { value: 'BUILDING', label: '开发中' },
  { value: 'LAUNCHED', label: '已上线' },
  { value: 'REVENUE', label: '有收入' },
  { value: 'PROFITABLE', label: '已盈利' },
]

const CONTENT_TYPE_OPTIONS = [
  { value: 'PROJECT', label: '项目' },
  { value: 'DEMAND', label: '需求' },
  { value: 'COOPERATION', label: '合作' },
]

interface ProjectItem {
  id: string
  slug?: string
  name: string
  description: string
  stage: string
  website: string | null
  contentType: string
  images: string[]
  _count?: { favorites: number; comments: number }
}

export function ProductsSection() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', stage: 'IDEA', website: '', contentType: 'PROJECT', images: [] as string[] })
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null)
  const [progressProjectSlug, setProgressProjectSlug] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/user/card')
      if (res.ok) {
        const data = await res.json()
        if (data.projects) setProjects(data.projects)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newProject.name.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/user/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(prev => [...prev, data])
        setNewProject({ name: '', description: '', stage: 'IDEA', website: '', contentType: 'PROJECT', images: [] })
        setShowNew(false)
        toast('产品已创建', 'success')
      }
    } catch {}
    setSaving(false)
  }

  const handleUpdate = async () => {
    if (!editingProject || !editingProject.name.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/user/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProject),
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(prev => prev.map(p => p.id === data.id ? data : p))
        setEditingProject(null)
        toast('产品已更新', 'success')
      }
    } catch {}
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (deleting === id) {
      try {
        const res = await fetch(`/api/user/projects/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setProjects(prev => prev.filter(p => p.id !== id))
          toast('已删除', 'success')
        }
      } catch {}
      setDeleting(null)
    } else {
      setDeleting(id)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  if (loading) return <div className="text-center py-12 text-mute">加载中...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">我的产品</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowNew(!showNew)} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> 添加
        </Button>
      </div>

      {showNew && (
        <ProjectForm
          project={newProject}
          onChange={setNewProject}
          onSubmit={handleCreate}
          onCancel={() => setShowNew(false)}
          submitLabel="创建"
          saving={saving}
        />
      )}

      {projects.length === 0 && !showNew && (
        <div className="bg-white rounded-2xl p-8 text-center border border-hairline">
          <Rocket className="h-10 w-10 mx-auto mb-3 text-ash" />
          <p className="text-sm text-ash">暂无产品，点击"添加"创建你的第一个产品</p>
        </div>
      )}

      {projects.map(proj => (
        <div key={proj.id}>
          {editingProject?.id === proj.id ? (
            <ProjectForm
              project={editingProject}
              onChange={(v) => setEditingProject(v as ProjectItem)}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProject(null)}
              submitLabel="保存"
              saving={saving}
            />
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-hairline">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-ink">{proj.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-card text-mute">
                      {STAGE_OPTIONS.find(o => o.value === proj.stage)?.label || proj.stage}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-mute line-clamp-2">{proj.description}</p>
                  {proj.images && proj.images.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {proj.images.slice(0, 3).map((url, i) => (
                        <div key={url} className="w-12 h-12 rounded-2xl overflow-hidden border border-hairline">
                          <img src={url} alt={`${proj.name} ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {proj.images.length > 3 && (
                        <div className="w-12 h-12 rounded-2xl border border-hairline flex items-center justify-center text-xs text-mute">+{proj.images.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-hairline">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingProject({ ...proj, images: proj.images || [] })} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> 编辑
                </Button>
                {proj.slug && (
                  <a href={`/projects/${proj.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="outline" size="sm" className="gap-1">
                      <ExternalLink className="h-3.5 w-3.5" /> 查看
                    </Button>
                  </a>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => proj.slug && setProgressProjectSlug(proj.slug)} className="gap-1" disabled={!proj.slug}>
                  <FileText className="h-3.5 w-3.5" /> 记录进展
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(proj.id)} className={`gap-1 ${deleting === proj.id ? 'text-red-600 border-red-200' : ''}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting === proj.id ? '确认删除？' : '删除'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {progressProjectSlug && (
        <ProgressDialog projectSlug={progressProjectSlug} onClose={() => setProgressProjectSlug(null)} />
      )}
    </div>
  )
}

function ProjectForm({ project, onChange, onSubmit, onCancel, submitLabel, saving }: {
  project: any
  onChange: (v: any) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  saving?: boolean
}) {
  return (
    <div className="rounded-2xl p-5 space-y-3 bg-surface-card border border-hairline">
      <Input value={project.name} onChange={e => onChange({ ...project, name: e.target.value })} placeholder="项目名称" />
      <div>
        <textarea
          value={project.description}
          onChange={e => onChange({ ...project, description: e.target.value })}
          placeholder="介绍你的产品：它解决什么问题、目标用户是谁、现在处于什么阶段……让其他创业者快速了解你在做的事"
          maxLength={500}
          rows={3}
          className="flex w-full rounded-2xl border border-hairline bg-white px-3 py-2 text-sm placeholder:text-ash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
        />
        <p className="text-xs text-ash text-right mt-1">{(project.description || '').length}/500</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select value={project.stage} onChange={e => onChange({ ...project, stage: e.target.value })} className="px-3 py-2 text-sm border border-hairline rounded-2xl bg-white">
          {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={project.contentType} onChange={e => onChange({ ...project, contentType: e.target.value })} className="px-3 py-2 text-sm border border-hairline rounded-2xl bg-white">
          {CONTENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <Input value={project.website || ''} onChange={e => onChange({ ...project, website: e.target.value })} placeholder="网站 URL（可选）" />
      <div>
        <label className="text-xs font-medium text-mute mb-1.5 block">产品图片（最多 8 张，第一张为封面）</label>
        <ImageUpload value={project.images} onChange={(images: string[]) => onChange({ ...project, images })} maxImages={8} />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onSubmit} disabled={!project.name.trim() || !!saving}>{submitLabel}</Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>取消</Button>
      </div>
    </div>
  )
}
