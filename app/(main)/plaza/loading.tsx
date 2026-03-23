export default function PlazaLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* 标题骨架 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧栏骨架 */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm space-y-2">
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-4" />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* 主内容双列骨架 */}
          <main className="lg:col-span-3">
            {/* Tab/排序骨架 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
              </div>
              <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
