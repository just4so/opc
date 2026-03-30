import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import prisma from '@/lib/db'
import crypto from 'crypto'
import { sendEmailVerifyEmail } from '@/lib/mailer'

const registerSchema = z.object({
  name: z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符'),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  password: z.string().min(6, '密码至少6个字符'),
  startupStage: z.string().optional(),
  mainTrack: z.string().optional(),
})

async function generateUsername(): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const candidate = 'user_' + Math.random().toString(36).slice(2, 10)
    const exists = await prisma.user.findUnique({ where: { username: candidate } })
    if (!exists) return candidate
  }
  return 'user_' + Date.now().toString(36)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      const firstIssue = validation.error.issues[0]
      let message = firstIssue.message
      if (message.startsWith('Invalid input') || message.startsWith('Required')) {
        message = '请填写手机号'
      }
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { name, phone, email, password, startupStage, mainTrack } = validation.data

    // 检查昵称是否已存在
    const existingName = await prisma.user.findFirst({
      where: { name },
    })
    if (existingName) {
      return NextResponse.json(
        { error: '昵称已被使用' },
        { status: 400 }
      )
    }

    // 检查手机号是否已存在
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    })
    if (existingPhone) {
      return NextResponse.json(
        { error: '该手机号已被注册' },
        { status: 400 }
      )
    }

    // 邮箱有填写时才检查重复
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: '邮箱已被注册' },
          { status: 400 }
        )
      }
    }

    // 创建用户
    const passwordHash = await hash(password, 12)
    const username = await generateUsername()
    const user = await prisma.user.create({
      data: {
        username,
        name,
        phone,
        ...(email ? { email } : {}),
        passwordHash,
        ...(startupStage ? { startupStage } : {}),
        ...(mainTrack ? { mainTrack } : {}),
      },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    })

    // 注册成功后若填了邮箱，异步发送验证邮件
    if (user.email) {
      const verifyToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      prisma.oneTimeToken.create({
        data: { userId: user.id, type: 'email_verify', token: verifyToken, expiresAt },
      }).then(() => sendEmailVerifyEmail(user.email!, verifyToken)).catch(console.error)
    }

    return NextResponse.json({
      message: '注册成功',
      user,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    )
  }
}
