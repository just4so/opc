export default function MarketDetailLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* 返回导航骨架 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
      </div>

      {/* 订单头部骨架 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* 类型图标骨架 */}
            <div className="w-16 h-16 rounded-2xl bg-gray-200 flex-shrink-0" />

            {/* 基本信息骨架 */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
              <div className="h-8 w-2/3 bg-gray-200 rounded" />
              <div className="h-5 w-1/2 bg-gray-200 rounded" />
            </div>

            {/* 预算骨架 */}
            <div className="text-right space-y-2">
              <div className="h-4 w-12 bg-gray-200 rounded ml-auto" />
              <div className="h-8 w-20 bg-gray-200 rounded ml-auto" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主内容骨架 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 需求描述卡片 */}
            <div className="bg-white rounded-lg border p-6 space-y-3">
              <div className="h-6 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
            </div>

            {/* 所需技能卡片 */}
            <div className="bg-white rounded-lg border p-6 space-y-3">
              <div className="h-6 w-24 bg-gray-200 rounded" />
              <div className="flex flex-wrap gap-2">
                <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                <div className="h-8 w-16 bg-gray-200 rounded-lg" />
              </div>
            </div>

            {/* 联系按钮卡片 */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-9 w-24 bg-gray-200 rounded" />
              </div>
            </div>
          </div>

          {/* 侧边栏骨架 */}
          <div className="space-y-6">
            {/* 订单信息卡片 */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="h-6 w-24 bg-gray-200 rounded" />
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-4 w-36 bg-gray-200 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>

            {/* 发布者卡片 */}
            <div className="bg-white rounded-lg border p-6 space-y-3">
              <div className="h-6 w-16 bg-gray-200 rounded" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
