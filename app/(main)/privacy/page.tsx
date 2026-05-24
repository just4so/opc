export const revalidate = false

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隐私政策',
  description: 'OPC圈隐私政策，了解我们如何收集、使用、存储和保护您的个人信息',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-8">
          隐私政策
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <p className="text-gray-500 mb-8">最后更新日期：2026 年 5 月</p>

          <div className="space-y-8 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">概述</h2>
              <p className="leading-relaxed">
                OPC圈（www.opcquan.com，以下简称"我们"）由北京数据胶囊科技有限公司运营。
                我们非常重视用户的隐私保护。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。
                使用我们的服务即表示您同意本政策的条款。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">信息收集</h2>
              <p className="leading-relaxed mb-4">我们可能收集以下类型的信息：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>注册信息：昵称、手机号、邮箱地址、密码（加密存储）</li>
                <li>个人资料：头像、简介、城市、创业方向等您主动填写的信息</li>
                <li>直通车信息：您提交的入驻意向、产品信息、BP 文件</li>
                <li>使用数据：浏览记录、发布内容、互动行为等</li>
                <li>设备信息：IP 地址、浏览器类型、操作系统等</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">信息使用</h2>
              <p className="leading-relaxed mb-4">我们使用收集的信息用于：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>提供、维护和改进我们的服务</li>
                <li>处理您的社区入驻意向，将您的信息推荐给相关社区</li>
                <li>在创业者广场展示您的卡片和产品（仅在您开启展示开关后）</li>
                <li>发送服务通知（如入驻意向状态变更、有人查看了您的卡片）</li>
                <li>保护平台安全，防止滥用行为</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">信息共享</h2>
              <p className="leading-relaxed mb-4">
                我们不会向第三方出售您的个人信息。仅在以下情况下可能共享信息：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>经您明确同意（如提交直通车意向时，我们会将您的信息推荐给相关社区）</li>
                <li>为遵守法律法规要求</li>
                <li>为保护我们和用户的合法权益</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">数据安全</h2>
              <p className="leading-relaxed">
                我们采用行业标准的安全措施来保护您的信息，包括数据加密传输（HTTPS）、
                密码加密存储（bcrypt）、数据库访问控制和安全审计。
                BP 文件存储在加密的云存储服务中，仅授权管理员可访问。
                但请注意，互联网传输不能保证 100% 安全。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">您的权利</h2>
              <p className="leading-relaxed mb-4">您有权：</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>在个人设置页面随时查看和更新您的个人信息</li>
                <li>关闭广场展示开关，隐藏您的创业者卡片</li>
                <li>要求删除您的账户和相关数据（请邮件联系我们）</li>
                <li>撤回您之前给予的同意</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">Cookie 使用</h2>
              <p className="leading-relaxed">
                我们使用 Cookie 来维持您的登录状态和改善用户体验。
                您可以通过浏览器设置管理 Cookie 偏好，但关闭 Cookie 可能影响部分功能的正常使用。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">政策更新</h2>
              <p className="leading-relaxed">
                我们可能会不时更新本隐私政策。重大变更时，我们会通过网站公告通知您。
                继续使用服务即表示您接受更新后的政策。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">联系我们</h2>
              <p className="leading-relaxed">
                如果您对本隐私政策有任何疑问，请通过
                <a href="mailto:cooperation@opcquan.com" className="text-primary hover:underline mx-1">
                  cooperation@opcquan.com
                </a>
                与我们联系。
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
