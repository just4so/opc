export default function NewsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 标题骨架 */}
      <div className="mb-8">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-5 w-80 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* 分类Tab骨架 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['全部', '政策', '融资', '活动', '工具', '案例', '科技', '故事'].map((_, i) => (
          <div key={i} className="h-9 w-16 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>

      {/* 原创专区骨架 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-14 bg-orange-200 rounded-full animate-pulse" />
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="w-full h-40 bg-gray-200 animate-pulse" />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-12 bg-orange-200 rounded-full animate-pulse" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="flex gap-2">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 更多资讯分割 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 资讯列表骨架 */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
              <div className="flex gap-3">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-24 h-16 bg-gray-200 rounded animate-pulse hidden sm:block flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
