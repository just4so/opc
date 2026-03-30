'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { useEffect, useRef, useCallback } from 'react'
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, ImageIcon, Unlink,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

async function uploadBase64Image(src: string): Promise<string | null> {
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    const file = new File([blob], `paste-${Date.now()}.png`, { type: blob.type || 'image/png' })
    const fd = new FormData()
    fd.append('file', file)
    const uploadRes = await fetch('/api/admin/upload/community-image', { method: 'POST', body: fd })
    if (!uploadRes.ok) return null
    const data = await uploadRes.json()
    return data.url
  } catch {
    return null
  }
}

export function RichTextEditor({ value, onChange, placeholder = '在这里输入内容...' }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInitialized = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Typography,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      handlePaste: (view, event) => {
        // 拦截粘贴中的 base64 图片，上传到 R2
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (!file) continue
            event.preventDefault()
            const fd = new FormData()
            fd.append('file', file)
            fetch('/api/admin/upload/community-image', { method: 'POST', body: fd })
              .then(r => r.json())
              .then(data => {
                if (data.url) {
                  view.dispatch(view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.image.create({ src: data.url })
                  ))
                }
              })
              .catch(() => {})
            return true
          }
        }
        return false
      },
    },
  })

  // 外部 value 变化时同步（仅初始化时）
  useEffect(() => {
    if (editor && !isInitialized.current) {
      isInitialized.current = true
    }
  }, [editor])

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/admin/upload/community-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run()
      }
    } catch {}
  }, [editor])

  if (!editor) return null

  const ToolbarButton = ({
    onClick, active = false, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded text-sm transition-colors ${
        active ? 'bg-primary/15 text-primary' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="标题1">
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="标题2">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="标题3">
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="加粗">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="删除线">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="分割线">
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton onClick={() => fileInputRef.current?.click()} active={false} title="插入图片">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} active={false} title="清除格式">
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* 隐藏图片输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }}
      />

      {/* 编辑区 */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-4 py-3 min-h-[300px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  )
}
