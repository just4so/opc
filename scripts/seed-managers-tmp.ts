import prisma from '@/lib/db'

async function main() {
  await prisma.cityManager.createMany({
    data: [
      {
        name: '陈立',
        title: '武汉主理人 · AI产品创业者',
        bio: '前互联网大厂产品总监，2023年开始全职创业，专注 AI 工具领域。现入驻光谷 OPC 社区，帮助武汉的 OPC 创业者少走弯路。',
        quote: '武汉是一座低调的城市，但这里的创业者从不低调。',
        focusTags: ['AI落地', '产品策略', '本地资源'],
        wechat: 'chenli_opc',
        scope: 'CITY',
        city: '武汉',
        province: '湖北',
        order: 10,
        status: 'ACTIVE',
      },
      {
        name: '李若珊',
        title: '深圳主理人 · 跨境电商创始人',
        bio: '连续创业者，三次创业经历，现主营跨境 DTC 品牌。深圳 OPC 社区深度玩家，熟悉前海、南山各类政策资源。',
        quote: '深圳的节奏很快，但 OPC 这个群体其实比你想的更有韧劲。',
        focusTags: ['跨境电商', 'DTC品牌', '供应链'],
        wechat: 'liruoshan_sz',
        scope: 'CITY',
        city: '深圳',
        province: '广东',
        order: 9,
        status: 'ACTIVE',
      },
      {
        name: '张宇',
        title: '北京主理人 · 独立顾问',
        bio: '做了8年的政策研究，现在给创业者提供 OPC 选社区、拿补贴的一站式咨询。',
        quote: '政策这东西，懂的人少，但值得懂。',
        focusTags: ['政策研究', '补贴申请'],
        wechat: 'zhangyu_bj_opc',
        scope: 'CITY',
        city: '北京',
        province: '北京',
        order: 8,
        status: 'ACTIVE',
      },
      {
        name: '王雪梅',
        title: '上海主理人 · 设计师创业者',
        bio: '独立设计师转型 OPC 创业者，现运营一个远程设计团队。',
        quote: '一个人创业不代表孤独，代表自由。',
        focusTags: ['设计', '远程协作'],
        wechat: null,
        scope: 'CITY',
        city: '上海',
        province: '上海',
        order: 7,
        status: 'ACTIVE',
      },
    ],
  })
  console.log('✅ 样例主理人数据插入完成')
}

main().catch(console.error).finally(() => prisma.$disconnect())
