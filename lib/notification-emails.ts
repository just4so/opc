import nodemailer from 'nodemailer'
import prisma from '@/lib/db'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SMTP_HOST,
  port: parseInt(process.env.MAIL_SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_AUTH_CODE,
  },
})

const SITE_URL = process.env.NEXTAUTH_URL || 'https://www.opcquan.com'

function emailWrapper(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #F97316, #ea580c); padding: 32px 40px; text-align: center;">
      <div style="font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px;">OPC圈</div>
    </div>
    <div style="padding: 40px;">
      ${bodyHtml}
    </div>
    <div style="padding: 20px 40px; border-top: 1px solid #f0f0f0; text-align: center;">
      <p style="margin: 0 0 8px; color: #bbb; font-size: 12px;">此邮件由系统自动发送，请勿回复 · OPC圈团队</p>
      <p style="margin: 0; color: #bbb; font-size: 11px;">不想收到邮件？在<a href="${SITE_URL}/settings" style="color: #F97316; text-decoration: underline;">设置</a>中关闭邮件通知</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendFollowEmail(
  targetUserId: string,
  followerName: string,
  followerUsername: string
) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { email: true, emailNotifications: true, emailVerified: true },
  })

  if (!user?.email || !user.emailNotifications || !user.emailVerified) return

  const profileUrl = `${SITE_URL}/profile/${followerUsername}`
  const html = emailWrapper(`
      <h2 style="margin: 0 0 16px; font-size: 20px; color: #1a1a1a;">有人关注了你</h2>
      <p style="margin: 0 0 24px; color: #555; line-height: 1.6;"><strong>${followerName}</strong> 开始关注你了，去看看 TA 的主页吧。</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${profileUrl}" style="display: inline-block; background: #F97316; color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600;">查看 TA 的主页</a>
      </div>`)

  await transporter.sendMail({
    from: `OPC圈 <${process.env.MAIL_USER}>`,
    to: user.email,
    subject: '有人关注了你',
    html,
    text: `${followerName} 关注了你。查看主页：${profileUrl}`,
  })
}

export async function sendCommentEmail(
  postAuthorId: string,
  commenterName: string,
  commentExcerpt: string,
  postId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: postAuthorId },
    select: { email: true, emailNotifications: true, emailVerified: true },
  })

  if (!user?.email || !user.emailNotifications || !user.emailVerified) return

  const postUrl = `${SITE_URL}/plaza/${postId}`
  const excerpt = commentExcerpt.length > 100
    ? commentExcerpt.slice(0, 100) + '...'
    : commentExcerpt

  const html = emailWrapper(`
      <h2 style="margin: 0 0 16px; font-size: 20px; color: #1a1a1a;">${commenterName} 评论了你的动态</h2>
      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
        <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">"${excerpt}"</p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${postUrl}" style="display: inline-block; background: #F97316; color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600;">查看评论</a>
      </div>`)

  await transporter.sendMail({
    from: `OPC圈 <${process.env.MAIL_USER}>`,
    to: user.email,
    subject: `${commenterName} 评论了你的动态`,
    html,
    text: `${commenterName} 评论了你的动态："${excerpt}"。查看：${postUrl}`,
  })
}

export async function sendDailyDigestEmail(
  userId: string,
  stats: { likeCount: number; viewCount: number }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailNotifications: true, emailVerified: true },
  })

  if (!user?.email || !user.emailNotifications || !user.emailVerified) return
  if (stats.likeCount === 0 && stats.viewCount === 0) return

  const items: string[] = []
  if (stats.likeCount > 0) items.push(`收到 <strong>${stats.likeCount}</strong> 个赞`)
  if (stats.viewCount > 0) items.push(`卡片被查看 <strong>${stats.viewCount}</strong> 次`)

  const html = emailWrapper(`
      <h2 style="margin: 0 0 16px; font-size: 20px; color: #1a1a1a;">你的 OPC圈 昨日动态</h2>
      <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">昨天你的动态有新互动：</p>
      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
        ${items.map(i => `<p style="margin: 0 0 8px; color: #333; font-size: 14px;">✨ ${i}</p>`).join('')}
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${SITE_URL}/plaza" style="display: inline-block; background: #F97316; color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600;">去广场看看</a>
      </div>`)

  await transporter.sendMail({
    from: `OPC圈 <${process.env.MAIL_USER}>`,
    to: user.email,
    subject: '你的 OPC圈 昨日动态',
    html,
    text: `昨日动态：${items.map(i => i.replace(/<[^>]+>/g, '')).join('，')}。${SITE_URL}/plaza`,
  })
}
