export default function NewsDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl animate-pulse">
      {/* 返回链接骨架 */}
      <div className="h-5 w-24 bg-gray-200 rounded mb-6" />

      {/* 头部骨架 */}
      <div className="mb-6">
        {/* 分类徽章 + 时间 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-16 bg-gray-200 rounded-full" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>

        {/* 标题 */}
        <div className="h-8 w-full bg-gray-200 rounded mb-2" />
        <div className="h-8 w-2/3 bg-gray-200 rounded mb-4" />

        {/* 封面图 */}
        <div className="w-full h-64 bg-gray-200 rounded-xl mb-6" />
      </div>

      {/* 正文段落骨架 */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-11/12 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
      </div>

      {/* 页脚返回链接骨架 */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <div className="h-5 w-24 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
