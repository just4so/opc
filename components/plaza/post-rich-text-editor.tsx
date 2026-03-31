'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { Bold, Italic, Link2, ImageIcon, Code, List, ListOrdered } from 'lucide-react'
import { useRef } from 'react'

interface PostRichTextEditorProps {
  onChange: (html: string) => void
  placeholder?: string
}

export function PostRichTextEditor({
  onChange,
  placeholder = '分享你的想法...',
}: PostRichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Typography,
    ],
    editorProps: {
      attributes: {
        class:
          'min-h-[160px] px-4 py-3 text-sm text-gray-700 focus:outline-none prose prose-sm max-w-none',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  const handleLink = () => {
    if (!editor) return
    const url = window.prompt('输入链接地址：', 'https://')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/post-image', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run()
      }
    } catch {
      // silent fail – user can retry
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!editor) return null

  const btn = (active: boolean) =>
    `p-1.5 rounded transition-colors ${
      active ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'
    }`

  return (
    <div className="border rounded-lg focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive('bold'))}
          title="加粗"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive('italic'))}
          title="斜体"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleLink}
          className={btn(editor.isActive('link'))}
          title="插入链接"
        >
          <Link2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={btn(false)}
          title="插入图片"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btn(editor.isActive('codeBlock'))}
          title="代码块"
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive('orderedList'))}
          title="有序列表"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive('bulletList'))}
          title="无序列表"
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  )
}
