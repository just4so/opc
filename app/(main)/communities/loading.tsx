export default function CommunitiesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* 城市Tab + 难度条骨架 */}
      <div className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {['全部', '深圳', '杭州', '北京', '上海', '苏州', '常州', '无锡'].map((_, i) => (
              <div key={i} className="h-9 w-20 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
            ))}
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-4 overflow-x-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="h-3 w-40 bg-gray-200 rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 地图区域骨架 */}
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse mb-8" />

        {/* 社区卡片网格骨架 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
