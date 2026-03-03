export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-8">
          联系方式
        </h1>

        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">
                商务合作 & 意见反馈
              </h2>
              <p className="text-gray-600 mb-4">
                如果您有任何问题、建议或合作意向，欢迎通过以下方式联系我们：
              </p>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a
                  href="mailto:luweiliangai@gmail.com"
                  className="text-primary hover:underline font-medium"
                >
                  luweiliangai@gmail.com
                </a>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">
                社区入驻申请
              </h2>
              <p className="text-gray-600">
                如果您运营OPC创业社区，希望将社区信息展示在平台上，请发送邮件至上述邮箱，
                我们会尽快与您联系。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-secondary mb-4">
                内容投稿
              </h2>
              <p className="text-gray-600">
                欢迎创业者分享创业故事、经验心得。投稿请发送邮件，并附上您的个人简介和文章内容。
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
