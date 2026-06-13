import { Metadata } from 'next'
import Link from 'next/link'
import prisma from '@/lib/db'
import { MapPin, Building2, BarChart3, Calendar } from 'lucide-react'

export const revalidate = 3600 // 1小时更新一次

export const metadata: Metadata = {
  title: 'OPC社区数据统计 · OPC圈',
  description: 'OPC圈收录全国OPC社区数据统计。截至2026年5月，收录全国39个城市159个OPC社区，是中国最全面的一人公司社区数据库。',
  keywords: 'OPC社区数量,全国OPC社区统计,一人公司社区数据,OPC圈数据',
}

export default async function DataPage() {
  const [total, cities] = await Promise.all([
    prisma.community.count({ where: { status: 'ACTIVE' } }),
    prisma.community.groupBy({
      by: ['city'],
      _count: true,
      where: { status: 'ACTIVE' },
      orderBy: { _count: { city: 'desc' } },
    }),
  ])

  const sortedCities = cities.sort((a, b) => (b._count as number) - (a._count as number))
  const updateDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* 页头 */}
      <div className="bg-canvas border-b">
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-mute mb-4">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <span>数据统计</span>
          </div>
          <h1 className="text-3xl font-bold text-ink mb-3">全国OPC社区数据统计</h1>
          <p className="text-mute text-lg">
            OPC圈持续收录、人工核实全国各地OPC社区信息，为一人公司创业者提供最真实可靠的参考数据。
          </p>
          <p className="text-sm text-ash mt-3">数据更新时间：{updateDate} · 来源：opcquan.com OPC社区数据库</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl space-y-10">

        {/* 核心数字 */}
        <section>
          <h2 className="text-xl font-semibold text-ink mb-5">核心数据</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-canvas rounded-xl p-6 border text-center">
              <div className="text-4xl font-bold text-orange-500 mb-1">{total}</div>
              <div className="text-mute text-sm">收录OPC社区总数</div>
            </div>
            <div className="bg-canvas rounded-xl p-6 border text-center">
              <div className="text-4xl font-bold text-orange-500 mb-1">{sortedCities.length}</div>
              <div className="text-mute text-sm">覆盖城市数量</div>
            </div>
            <div className="bg-canvas rounded-xl p-6 border text-center col-span-2 md:col-span-1">
              <div className="text-4xl font-bold text-orange-500 mb-1">100%</div>
              <div className="text-mute text-sm">人工核实</div>
            </div>
          </div>
        </section>

        {/* 城市分布 */}
        <section>
          <h2 className="text-xl font-semibold text-ink mb-2">城市分布</h2>
          <p className="text-mute text-sm mb-5">
            全国共 {sortedCities.length} 个城市有OPC社区，以长三角、珠三角、京津冀为主要集中区域。
          </p>
          <div className="bg-canvas rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-soft border-b">
                <tr>
                  <th className="text-left px-5 py-3 text-mute font-medium">排名</th>
                  <th className="text-left px-5 py-3 text-mute font-medium">城市</th>
                  <th className="text-left px-5 py-3 text-mute font-medium">社区数量</th>
                  <th className="text-left px-5 py-3 text-mute font-medium hidden md:table-cell">占比</th>
                  <th className="text-left px-5 py-3 text-mute font-medium">查看</th>
                </tr>
              </thead>
              <tbody>
                {sortedCities.map((city, index) => (
                  <tr key={city.city} className="border-b last:border-0 hover:bg-surface-soft transition-colors">
                    <td className="px-5 py-3 text-ash">
                      {index < 3 ? (
                        <span className={`font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-ash' : 'text-orange-400'}`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-ash">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-ink">{city.city}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 bg-orange-400 rounded-full"
                          style={{ width: `${Math.max(8, ((city._count as number) / sortedCities[0]._count) * 80)}px` }}
                        />
                        <span className="text-charcoal">{city._count as number} 个</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-mute hidden md:table-cell">
                      {(((city._count as number) / total) * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/communities?city=${encodeURIComponent(city.city)}`}
                        className="text-orange-500 hover:text-orange-600 text-xs"
                      >
                        查看 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 数据说明 */}
        <section className="bg-canvas rounded-xl border p-6">
          <h2 className="text-xl font-semibold text-ink mb-4">数据说明</h2>
          <div className="space-y-3 text-sm text-mute">
            <p>
              <strong className="text-ink">收录标准：</strong>
              OPC圈收录的社区均为专为一人公司、个体创业者设计的创业空间，包括政府主导的OPC社区、国有平台运营的创业园区等，不包括普通联合办公空间。
            </p>
            <p>
              <strong className="text-ink">核实方式：</strong>
              所有社区信息经过人工核实，包括实地走访、电话确认、官方渠道查证等方式，确保地址、费用、政策信息的准确性。
            </p>
            <p>
              <strong className="text-ink">更新频率：</strong>
              数据库持续更新，新社区开业、政策调整、社区关闭等信息会及时同步。如发现数据有误，欢迎通过
              <Link href="/about#contact" className="text-orange-500 hover:underline mx-1">联系我们</Link>
              反馈。
            </p>
            <p>
              <strong className="text-ink">引用说明：</strong>
              如需引用本平台数据，请注明来源：OPC圈（opcquan.com）。
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6">
          <p className="text-mute mb-4">想找适合自己的OPC社区？</p>
          <Link
            href="/communities"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl hover:bg-orange-600 transition-colors font-medium"
          >
            <Building2 className="h-4 w-4" />
            浏览全部社区
          </Link>
        </section>

      </div>
    </div>
  )
}
