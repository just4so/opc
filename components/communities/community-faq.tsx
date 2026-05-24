import Link from 'next/link'

interface CommunityFaqProps {
  communityName: string
  city: string
  entryFriendly?: number | null
  focusTracks?: string[]
}

export function CommunityFaq({
  communityName,
  city,
  entryFriendly,
  focusTracks,
}: CommunityFaqProps) {
  // 价格描述
  const priceText = `${communityName}的具体费用建议直接联系社区咨询，部分OPC社区提供免费或补贴工位，政府主导的社区通常有免租期或折扣优惠。`

  // 入驻难度描述
  const difficultyText = (() => {
    if (!entryFriendly) return '建议直接联系社区了解入驻条件'
    if (entryFriendly >= 4) return '入驻门槛较低，欢迎各类一人公司和个体创业者'
    if (entryFriendly === 3) return '入驻有一定要求，通常需要提交项目介绍或商业计划'
    return '入驻门槛较高，通常需要符合特定行业方向或通过评审'
  })()

  // 行业方向描述
  const tracksText = focusTracks && focusTracks.length > 0
    ? `${communityName}重点支持 ${focusTracks.slice(0, 3).join('、')} 等方向的创业者`
    : `${communityName}欢迎各类一人公司和个体创业者入驻`

  const faqs = [
    {
      q: `${communityName}是什么类型的社区？`,
      a: `${communityName}是位于${city}的OPC社区（一人公司专属创业空间），专为一人公司、个体创业者、自由职业者设计。${tracksText}，提供办公空间、工商注册地址及相关政策支持。`,
    },
    {
      q: `${communityName}入驻费用是多少？`,
      a: `${priceText}。OPC社区的费用通常低于普通联合办公，部分政府主导的社区还提供免租期或补贴。具体费用以社区官方公告为准。`,
    },
    {
      q: `${communityName}入驻难度如何？需要什么条件？`,
      a: `${difficultyText}。一般需要已注册或计划注册一人公司/个体工商户，部分社区要求经营方向符合园区定位。建议提前联系社区了解最新入驻要求。`,
    },
    {
      q: `${city}还有哪些OPC社区？`,
      a: `OPC圈收录了${city}的多个OPC社区，可以在社区列表页按城市筛选查看全部选项，对比费用、政策和入驻条件。`,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="border-t pt-10">
        <h2 className="text-lg font-semibold text-ink mb-5">常见问题</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <div key={item.q} className="bg-surface-soft rounded-xl p-5">
              <h3 className="font-medium text-ink mb-2 text-sm">{item.q}</h3>
              <p className="text-mute text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-ash mt-4 text-center">
          更多问题请查看{' '}
          <Link href="/faq" className="text-orange-500 hover:underline">OPC社区常见问题</Link>
          {' '}或{' '}
          <Link href={`/communities?city=${encodeURIComponent(city)}`} className="text-orange-500 hover:underline">
            {city}全部社区
          </Link>
        </p>
      </div>
    </div>
  )
}
