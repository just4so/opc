import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPresignedUploadUrl } from '@/lib/r2'
import { z } from 'zod'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

const MAX_SIZE_MB = 20

const schema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().refine((t) => ALLOWED_TYPES.includes(t), {
    message: '仅支持 PDF、DOC、DOCX、PPT、PPTX 格式',
  }),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '参数错误' },
        { status: 400 }
      )
    }

    const { filename, contentType } = parsed.data
    const key = `bp/${session.user.id}/${Date.now()}-${filename}`

    const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType)

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
      maxSizeMB: MAX_SIZE_MB,
    })
  } catch (error) {
    console.error('BP upload presign error:', error)
    return NextResponse.json({ error: '获取上传地址失败' }, { status: 500 })
  }
}
