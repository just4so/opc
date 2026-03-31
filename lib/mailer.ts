import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SMTP_HOST,
  port: parseInt(process.env.MAIL_SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_AUTH_CODE,
  },
})

function generateResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #F97316, #ea580c); padding: 32px 40px; text-align: center;">
      <div style="font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px;">OPC圈</div>
    </div>
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 20px; color: #1a1a1a;">重置你的密码</h2>
      <p style="margin: 0 0 8px; color: #555; line-height: 1.6;">你好，</p>
      <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">我们收到了你的密码重置请求。点击下方按钮重置密码（链接 <strong>1小时</strong>内有效）：</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #F97316; color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600;">重置密码</a>
      </div>
      <p style="margin: 0 0 8px; color: #888; font-size: 13px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
      <p style="margin: 0 0 24px; color: #F97316; font-size: 13px; word-break: break-all;">${resetUrl}</p>
      <p style="margin: 0; color: #aaa; font-size: 13px;">如果你没有申请重置密码，请忽略此邮件，你的账户仍然安全。</p>
    </div>
    <div style="padding: 20px 40px; border-top: 1px solid #f0f0f0; text-align: center;">
      <p style="margin: 0; color: #bbb; font-size: 12px;">此邮件由系统自动发送，请勿回复 · OPC圈团队</p>
    </div>
  </div>
</body>
</html>`
}

function generateVerifyEmailHtml(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #F97316, #ea580c); padding: 32px 40px; text-align: center;">
      <div style="font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px;">OPC圈</div>
    </div>
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 20px; color: #1a1a1a;">验证你的邮箱</h2>
      <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">欢迎来到 OPC圈！点击下方按钮验证你的邮箱（链接 <strong>24小时</strong>内有效）：</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background: #F97316; color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600;">验证邮箱</a>
      </div>
      <p style="margin: 0 0 8px; color: #888; font-size: 13px;">如果按钮无法点击，请复制以下链接到浏览器：</p>
      <p style="margin: 0 0 24px; color: #F97316; font-size: 13px; word-break: break-all;">${verifyUrl}</p>
      <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin-top: 16px;">
        <p style="margin: 0 0 8px; color: #555; font-size: 14px; font-weight: 600;">验证成功后你将获得：</p>
        <p style="margin: 0 0 4px; color: #555; font-size: 13px;">✅ 接收 OPC 社区最新资讯</p>
        <p style="margin: 0 0 4px; color: #555; font-size: 13px;">✅ 密码找回保障</p>
        <p style="margin: 0; color: #555; font-size: 13px;">✅ 账户安全通知</p>
      </div>
    </div>
    <div style="padding: 20px 40px; border-top: 1px solid #f0f0f0; text-align: center;">
      <p style="margin: 0; color: #bbb; font-size: 12px;">此邮件由系统自动发送，请勿回复 · OPC圈团队</p>
    </div>
  </div>
</body>
</html>`
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
  await transporter.sendMail({
    from: `OPC圈 <${process.env.MAIL_USER}>`,
    to,
    subject: '重置你的 OPC圈 密码',
    html: generateResetEmailHtml(resetUrl),
    text: `重置密码链接（1小时内有效）：${resetUrl}`,
  })
}

export async function sendEmailVerifyEmail(to: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`
  await transporter.sendMail({
    from: `OPC圈 <${process.env.MAIL_USER}>`,
    to,
    subject: '验证你的 OPC圈 邮箱',
    html: generateVerifyEmailHtml(verifyUrl),
    text: `邮箱验证链接（24小时内有效）：${verifyUrl}`,
  })
}
