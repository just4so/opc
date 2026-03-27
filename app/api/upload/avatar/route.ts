import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: '仅支持 JPG、PNG、WebP、GIF 格式' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: '图片大小不能超过 2MB' },
        { status: 400 }
      )
    }

    let buffer = Buffer.from(await file.arrayBuffer())

    // Try to resize with sharp if available
    try {
      const sharp = require('sharp')
      buffer = await sharp(buffer)
        .resize(200, 200, { fit: 'cover' })
        .toBuffer()
    } catch {
      // sharp not available, use original image
    }

    const key = `avatars/${session.user.id}/${Date.now()}.${ext}`

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
    console.error('头像上传失败:', error)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
