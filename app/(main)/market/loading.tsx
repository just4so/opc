export default function MarketLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题骨架 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-9 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 筛选栏骨架 */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="mb-4">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        {/* 卡片网格骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between mb-3">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="flex justify-between mb-4">
                <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-5 w-14 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
