import { Metadata } from 'next'
import Link from 'next/link'

export const revalidate = 86400

export const metadata: Metadata = {
  title: '常见问题 · OPC社区入驻指南 · OPC圈',
  description: '关于OPC社区的常见问题解答：什么是OPC社区、入驻费用多少、需要什么条件、和联合办公有什么区别、全国哪些城市有OPC社区等。',
  keywords: 'OPC社区常见问题,OPC社区入驻条件,OPC社区费用,一人公司社区,OPC圈FAQ',
}

const faqs = [
  {
    category: '基础概念',
    items: [
      {
        q: '什么是OPC社区？',
        a: 'OPC社区（One Person Company社区）是专为一人公司、个体创业者、自由职业者设计的创业空间。通常由地方政府、国有平台或产业园区运营，提供低成本办公空间、工商注册地址、政策扶持和创业者社群。OPC是"One Person Company"（一人公司）的缩写，代表一种新型的轻量化创业形态。',
      },
      {
        q: 'OPC社区和普通联合办公有什么区别？',
        a: 'OPC社区和联合办公的主要区别有三点：第一，OPC社区通常有政府背景，能提供工商注册地址和政策补贴，联合办公一般不提供；第二，OPC社区的目标用户是一人公司和个体创业者，社群氛围更垂直；第三，OPC社区的费用通常更低，部分社区提供免费或极低价格的办公空间。',
      },
      {
        q: '一人公司是什么？适合入驻OPC社区吗？',
        a: '一人公司是指只有一名股东的有限责任公司，是中国《公司法》认可的合法公司形式。一人公司非常适合入驻OPC社区——OPC社区本身就是为一人公司量身设计的，提供注册地址、政策支持、低成本办公空间，以及与同类创业者交流的社群环境。',
      },
    ],
  },
  {
    category: '入驻相关',
    items: [
      {
        q: 'OPC社区入驻需要什么条件？',
        a: '不同社区的入驻条件有所不同，但通常需要：1）已注册或计划注册一人公司/个体工商户；2）经营方向符合社区定位（部分社区专注AI、科技、创意等特定领域）；3）提交基本的商业计划或项目介绍。部分社区对入驻者有行业背景要求，建议直接联系目标社区确认。',
      },
      {
        q: 'OPC社区入驻费用大概多少？',
        a: 'OPC社区的费用差异较大，从免费到数千元/月不等。政府主导的社区通常提供免费或极低价格（如首年免租、2.5折优惠）；市场化运营的社区费用相对较高，一般在500-3000元/月之间。具体费用建议查看OPC圈各社区详情页，或直接联系社区咨询。',
      },
      {
        q: '入驻OPC社区能获得哪些政策支持？',
        a: '不同城市和社区的政策支持不同，常见的包括：工商注册地址（可用于营业执照）、租金补贴或免租期、算力券/云服务资源、融资对接和投资人资源、政府采购优先推荐、人才落户支持等。具体政策以各社区官方公告为准。',
      },
      {
        q: '可以用OPC社区地址注册公司吗？',
        a: '大多数OPC社区支持用其地址注册公司，这也是OPC社区的核心价值之一。但建议入驻前明确确认该社区是否提供注册地址服务，以及是否支持你所在行业的经营范围。部分社区仅提供办公空间，不提供注册地址。',
      },
    ],
  },
  {
    category: '城市与选择',
    items: [
      {
        q: '全国哪些城市有OPC社区？',
        a: '截至2026年5月，OPC圈收录了全国39个城市的159个OPC社区，覆盖城市包括：南京、扬州、杭州、深圳、苏州、北京、广州、合肥、上海、成都、重庆、无锡、武汉、长沙、济南、宁波、常州、厦门、西安、青岛、沈阳、天津、佛山、海口、昆明、太原、东莞、南宁等。其中长三角地区（南京、扬州、杭州、苏州）社区数量最多。',
      },
      {
        q: '如何选择适合自己的OPC社区？',
        a: '选择OPC社区可以从以下几个维度考虑：1）地理位置——是否方便通勤或见客户；2）行业匹配——社区是否有同行业的创业者；3）政策支持——是否有你需要的补贴或资源；4）费用预算——月租是否在可接受范围内；5）社群活跃度——是否有定期活动和资源对接。OPC圈提供各社区的详细信息和真实评价，可以帮助你做对比。',
      },
      {
        q: '北京/上海/深圳有哪些OPC社区？',
        a: '北京有12个OPC社区，上海有7个，深圳有12个。具体社区信息、地址、费用和入驻条件，可以在OPC圈社区列表页按城市筛选查看。',
      },
    ],
  },
  {
    category: '关于OPC圈',
    items: [
      {
        q: 'OPC圈是什么平台？',
        a: 'OPC圈（opcquan.com）是中国最全面的OPC社区信息平台，专注于收录、核实和分享全国各地OPC创业社区的真实信息。平台通过人工核实和创业者共创的方式，为一人公司创业者提供可靠的社区信息、入驻攻略和行业资讯。',
      },
      {
        q: 'OPC圈的数据准确吗？多久更新一次？',
        a: 'OPC圈的所有社区信息均经过人工核实，包括实地走访、电话确认、官方渠道查证等方式。数据库持续更新，新社区开业、政策调整等信息会及时同步。如发现数据有误，欢迎通过联系页面反馈，我们会尽快核实更新。',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <span>常见问题</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">常见问题</h1>
          <p className="text-gray-600">关于OPC社区入驻、费用、政策支持的常见问题解答。</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-3xl space-y-10">
        {faqs.map((section) => (
          <section key={section.category}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">{section.category}</h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.q} className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{item.q}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 text-center">
          <p className="text-gray-700 mb-4">没找到你想要的答案？</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/communities"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              浏览全部社区
            </Link>
            <Link
              href="/plaza"
              className="inline-flex items-center justify-center gap-2 border border-orange-300 text-orange-600 px-5 py-2.5 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium"
            >
              去交流广场提问
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
