export default function HomeLoading() {
  return (
    <div className="flex flex-col">
      {/* Hero 骨架 */}
      <section className="py-24 px-4 bg-gradient-subtle">
        <div className="container mx-auto text-center">
          <div className="h-12 w-2/3 bg-gray-200 rounded animate-pulse mx-auto mb-6" />
          <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse mx-auto mb-10" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="h-14 w-36 bg-gray-300 rounded-xl animate-pulse" />
            <div className="h-14 w-36 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </section>

      {/* 动态条骨架 */}
      <div className="h-10 bg-white border-y border-gray-100" />

      {/* 统计数据骨架 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-gray-50">
                <div className="h-10 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 真实案例骨架 */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-12" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-soft p-6">
                <div className="h-6 w-28 bg-orange-100 rounded-full animate-pulse mb-4" />
                <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-2 mb-6">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心功能骨架 */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-16" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-xl bg-white shadow-soft">
                <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse mb-4" />
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 热门城市骨架 */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mx-auto mb-4" />
          <div className="h-5 w-56 bg-gray-200 rounded animate-pulse mx-auto mb-12" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-5 rounded-xl bg-gray-50 text-center">
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 创业资讯骨架 */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="h-7 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="bg-white rounded-xl shadow-soft divide-y divide-gray-100">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="flex gap-3">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 骨架 */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="h-8 w-48 bg-gray-600 rounded animate-pulse mx-auto mb-4" />
          <div className="h-5 w-64 bg-gray-600 rounded animate-pulse mx-auto mb-8" />
          <div className="h-12 w-40 bg-gray-600 rounded-xl animate-pulse mx-auto" />
        </div>
      </section>
    </div>
  )
}
