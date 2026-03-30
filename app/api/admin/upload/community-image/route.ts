import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isStaff } from '@/lib/admin'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !(await isStaff(session.user.id))) {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: '仅支持 JPG、PNG、WebP 格式' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: '图片大小不能超过 5MB' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const random = Math.random().toString(36).slice(2, 8)
    const key = `communities/${Date.now()}-${random}.${ext}`

    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`
    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('社区图片上传失败:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
