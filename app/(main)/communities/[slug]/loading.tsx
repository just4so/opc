export default function CommunityDetailLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* 返回导航骨架 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
      </div>

      {/* 封面图骨架 */}
      <div className="bg-white border-b">
        <div className="w-full h-48 md:h-64 bg-gray-200" />

        <div className="container mx-auto px-4 py-6">
          {/* 名称 + 徽章 */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="h-9 w-48 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>

          {/* 城市 + 运营主体 */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-5 w-32 bg-gray-200 rounded" />
          </div>

          {/* Stat chips */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="h-8 w-24 bg-gray-200 rounded-full" />
            <div className="h-8 w-24 bg-gray-200 rounded-full" />
            <div className="h-8 w-28 bg-gray-200 rounded-full" />
          </div>

          {/* Tagline */}
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容区骨架 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 登录提示卡片骨架 */}
            <div className="h-48 bg-gray-200 rounded-lg" />

            {/* 详情卡片骨架 */}
            <div className="bg-white rounded-lg border p-6 space-y-3">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
            </div>

            {/* 第二个内容卡片骨架 */}
            <div className="bg-white rounded-lg border p-6 space-y-3">
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>

          {/* 右侧边栏骨架 */}
          <div className="space-y-6">
            {/* CTA 卡片骨架 */}
            <div className="bg-white rounded-lg border p-6">
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>

            {/* 地图卡片骨架 */}
            <div className="bg-white rounded-lg border p-6 space-y-3">
              <div className="h-6 w-24 bg-gray-200 rounded" />
              <div className="h-40 w-full bg-gray-200 rounded" />
            </div>

            {/* 联系信息骨架 */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="h-6 w-24 bg-gray-200 rounded" />
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
