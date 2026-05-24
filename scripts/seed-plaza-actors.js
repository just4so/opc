/**
 * seed-plaza-actors.js
 * 丰富演员账号 profile + 创建产品数据，让广场「人」和「产品」标签有内容
 * 运行: node scripts/seed-plaza-actors.js
 */

const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

// dicebear avataaars 风格头像（人脸风格，有真实感）
function avatar(seed) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
}

// 每个账号的完整设计
// contentType: PROJECT(我在做的) | DEMAND(我需要) | COOPERATION(我能提供)
const ACTORS = [
  {
    username: 'beijing_xiaoyu',
    bio: '战略咨询背景，独立AI顾问，帮传统制造、零售企业制定AI转型路径图，收过最贵的单子是一份48万的诊断报告。',
    product: {
      name: 'AI转型诊断报告',
      tagline: '为传统企业定制AI落地路径，从诊断到方案交付',
      description: '提供一对一企业AI转型咨询服务。核心交付物：现状诊断报告 + AI机会地图 + 分阶段落地方案。已服务15家企业，涵盖制造、零售、教培行业。收费透明，按项目制，不卖课不卖软件。',
      contentType: 'PROJECT',
      stage: 'REVENUE',
      website: null,
    }
  },
  {
    username: 'shenyang_tech',
    bio: '独立开发者，做小微企业HR SaaS，考勤+绩效一体化，用户主要是10-50人的小公司，月订阅制，已跑18个月。',
    product: {
      name: 'HRLight 小微考勤系统',
      tagline: '专为10-50人小公司设计的轻量HR工具',
      description: '不需要实施、不需要培训，注册即用。核心功能：钉钉/微信打卡 + 排班 + 绩效打分 + 工资单生成。现有付费用户230家，月流水4.2万，正在开发工时成本分析模块。',
      contentType: 'PROJECT',
      stage: 'REVENUE',
      website: null,
    }
  },
  {
    username: 'nanjing_laoxu',
    bio: '营销老兵转型AI，整合品牌策划+AI投放，帮南京本地餐饮和零售做增长，做过最大的单子是一家连锁火锅品牌。',
    product: {
      name: '本地商户AI增长包',
      tagline: '餐饮零售门店专用，AI内容+投放一站式',
      description: '针对南京/长三角本地餐饮、零售门店，提供：品牌定位梳理、AI生成每日内容素材、美团/抖音本地推投放优化。按效果收费，保底到店转化率提升20%，否则退钱。',
      contentType: 'PROJECT',
      stage: 'PROFITABLE',
      website: null,
    }
  },
  {
    username: 'shenzhen_global',
    bio: '跨境电商老司机，Amazon+独立站双轮驱动，用AI做选品和listing优化，每年GMV稳定在500万以上。',
    product: {
      name: 'AI选品情报周报',
      tagline: '跨境卖家专用，每周推送蓝海品类分析',
      description: '基于Amazon BSR变动、Google Trends、TikTok热品数据，AI筛选+人工复核，每周推送5-8个有机会的细分品类。订阅制，月99元，已有280名付费订阅者。',
      contentType: 'PROJECT',
      stage: 'REVENUE',
      website: null,
    }
  },
  {
    username: 'chengdu_slow',
    bio: '在成都做AI短视频，佛系但出货——每条视频都是AI辅助流水线生产，单月最高出过300条。',
    product: {
      name: 'AI短视频量产工作流',
      tagline: '一套可复制的AI短视频生产SOP',
      description: '整套工作流文档+提示词库+工具清单，包含：选题策略、脚本生成、AI配音、自动剪辑、批量发布。已帮15个账号从0跑到日更，其中3个超过50万粉。卖文档+1对1答疑，一次性付费。',
      contentType: 'PROJECT',
      stage: 'PROFITABLE',
      website: null,
    }
  },
  {
    username: 'shanghai_karen',
    bio: '连续创业者，在上海做高净值创业者社群，把懂AI、在做OPC的人聚在一起，做真实的资源对接，不是喝酒吹牛。',
    product: {
      name: 'Karen OPC私董会',
      tagline: '上海高净值一人公司创业者闭门圈子',
      description: '每月一次线下闭门会，12人制，话题围绕：AI工具落地、商业模式验证、资源互换。入圈需申请，年费制，已有38名活跃成员，促成合作项目11个。',
      contentType: 'PROJECT',
      stage: 'PROFITABLE',
      website: null,
    }
  },
  {
    username: 'xiamen_xiaolin',
    bio: '设计师创业，用AI降低设计成本，主打中小企业品牌视觉外包，从LOGO到全套VI一个人搞定。',
    product: {
      name: 'AI品牌视觉外包服务',
      tagline: '中小企业品牌设计，AI+人工，7天交付',
      description: '提供：LOGO设计、品牌色彩系统、名片/物料、社交媒体视觉模板。AI辅助初稿，人工精修交付，比传统设计公司便宜60%，比纯AI更有品牌感。已服务80+企业。',
      contentType: 'COOPERATION',
      stage: 'PROFITABLE',
      website: null,
    }
  },
  {
    username: 'hangzhou_mumu',
    bio: '知识付费老玩家，把线下课程搬到AI时代，用AI助教提升学员完课率，主力产品月流水稳定在3万以上。',
    product: {
      name: '一人公司变现课',
      tagline: '从0到月流水3万，OPC创业者实战课',
      description: '12周课程，覆盖：商业模式选择、冷启动获客、定价策略、交付流程标准化。AI助教7×24答疑，同期学员社群互助。已跑4期，完课率71%，结业后90天内收入翻倍案例占42%。',
      contentType: 'PROJECT',
      stage: 'REVENUE',
      website: null,
    }
  },
  {
    username: 'shanghai_aigc',
    bio: '影视从业者转型，专做AI短剧和AIGC视频内容，帮品牌方低成本产出剧情广告，单条成本压到传统拍摄的1/10。',
    product: {
      name: 'AIGC品牌剧情广告',
      tagline: '传统拍摄1/10成本，AI生成品牌剧情短片',
      description: '使用Sora、Runway、Kling等工具，结合真实分镜脚本，为品牌生产15-60秒剧情广告。已交付客户：美妆、教培、本地服务行业。单条报价8000-3万，比传统拍摄省90%。',
      contentType: 'PROJECT',
      stage: 'REVENUE',
      website: null,
    }
  },
  {
    username: 'beijing_indie_dev',
    bio: '从大厂辞职做独立开发，已上线3款效率类SaaS工具，月流水破万，正在做第4款，专注解决远程团队的具体痛点。',
    product: {
      name: 'MeetSnap 会议纪要SaaS',
      tagline: 'AI自动生成会议纪要，支持中文识别和Action跟踪',
      description: '接入飞书/腾讯会议，会议结束自动生成结构化纪要：议题总结、决策记录、Action清单+负责人+截止日期。已有付费用户420个，月流水1.2万，正在开发企业版API。',
      contentType: 'PROJECT',
      stage: 'REVENUE',
      website: null,
    }
  },
  {
    username: 'shenzhen_hardware',
    bio: '深圳硬件创业老炮，做AI+IoT结合的智能硬件，从方案设计到量产全链路自己搞，已量产2款产品。',
    product: {
      name: 'AI工厂巡检仪',
      tagline: '工厂产线AI视觉检测设备，降低人工质检成本',
      description: '基于边缘AI芯片+工业相机，实时检测产线缺陷，准确率98.7%，比人工快5倍。已在深圳、东莞3家工厂试部署，正在找代理商和系统集成商合作推广。',
      contentType: 'PROJECT',
      stage: 'LAUNCHED',
      website: null,
    }
  },
  {
    username: 'xiamen_nomad',
    bio: '从上海搬到厦门做数字游民，接远程UI设计+前端开发外包，同时运营一个数字游民社区，已有200+活跃成员。',
    product: {
      name: '厦门数字游民社区',
      tagline: '厦门本地游民互助圈，资源共享+项目合作',
      description: '200+成员，覆盖设计、开发、写作、运营各领域。每月线下聚会+在线项目对接频道。入门免费，高级会员（项目对接优先权+简历推荐）年费299元。',
      contentType: 'PROJECT',
      stage: 'PROFITABLE',
      website: null,
    }
  },
  {
    username: 'wuhan_student',
    bio: '武汉在读生，在校就开始创业，做校园AI效率工具，服务同学提效，已经过了靠补贴活着的阶段。',
    product: {
      name: '论文助手Pro',
      tagline: '大学生专用AI写作辅助工具，合规不作弊',
      description: '帮助学生梳理论文结构、找文献、生成提纲、润色语言，不代写全文，强调辅助而非替代。月活3200人，付费转化率18%，月流水6000元。正在拓展高中生市场。',
      contentType: 'PROJECT',
      stage: 'LAUNCHED',
      website: null,
    }
  },
  {
    username: 'suzhou_o2o',
    bio: '专注苏州本地生活赛道，用AI做本地商户数字化营销，帮餐饮门店做到店引流，服务了60+本地商户。',
    product: {
      name: '门店AI营销管家',
      tagline: '餐饮门店专用，AI生成每日内容+美团排名优化',
      description: '每天自动生成3条适合门店的短视频脚本/图文内容，结合美团/点评关键词优化策略，帮门店在本地搜索中排名靠前。月服务费800元，已服务苏州60+门店，平均到店量提升35%。',
      contentType: 'PROJECT',
      stage: 'PROFITABLE',
      website: null,
    }
  },
  {
    username: 'shanghai_pr',
    bio: '10年500强品牌公关经验，现独立做品牌和PR咨询，帮科技创业公司做从0到1的品牌定位和媒体传播。',
    product: {
      name: '创业公司PR启动包',
      tagline: '帮科技创业公司搭建媒体关系，从0到第一篇报道',
      description: '服务内容：品牌故事提炼、媒体资源库建立、首篇报道策划+发稿、危机应对预案。3个月项目制，固定报价3.8万，已帮12家创业公司登上36氪/虎嗅/钛媒体。',
      contentType: 'COOPERATION',
      stage: 'PROFITABLE',
      website: null,
    }
  },
  {
    username: 'guangzhou_outbound',
    bio: '做了8年跨境，现在专攻TikTok Shop+Shopify独立站，主要打东南亚市场，团队就我一个人+2个兼职。',
    product: {
      name: 'TikTok Shop东南亚起号方案',
      tagline: '从0到月销5万，TikTok Shop东南亚实操方案',
      description: '选品策略+达人矩阵搭建+AI广告素材生产+数据复盘SOP一整套。已帮6个品牌在泰国/马来西亚TikTok Shop从0起步，最快2个月月销破5万。提供3个月陪跑服务。',
      contentType: 'PROJECT',
      stage: 'REVENUE',
      website: null,
    }
  },
  {
    username: 'shanghai_legalai',
    bio: '律师出身，把法律服务标准化+AI化，做帮中小企业合规和合同审查的SaaS，不卖法律咨询卖标准化工具。',
    product: {
      name: 'ContractAI 合同审查SaaS',
      tagline: '中小企业合同AI审查工具，5分钟出风险报告',
      description: '上传合同PDF，AI自动识别：条款风险、缺失保护条款、合规问题，输出可操作的修改建议。已覆盖：劳动合同、采购合同、服务协议等10类合同模板。月订阅199元，已有340家企业订阅。',
      contentType: 'PROJECT',
      stage: 'REVENUE',
      website: null,
    }
  },
  {
    username: 'beijing_aiedu',
    bio: '前教培机构校长，现在做AI时代的职业技能教育，帮职场人学会用AI提升工作竞争力，课程完课率行业第一。',
    product: {
      name: 'AI职场技能训练营',
      tagline: '21天学会用AI提升工作效率，完课率82%',
      description: '面向职场人的AI工具实操课：ChatGPT/Notion AI/Midjourney全套工具+场景化实战任务。21天训练营，每天30分钟，AI助教即时批改作业。已跑9期，学员总数1800人，好评率94%。',
      contentType: 'PROJECT',
      stage: 'REVENUE',
      website: null,
    }
  },
  {
    username: 'wuhan_ahui',
    bio: 'SaaS工具开发者，专注小团队协作效率，用Python和LLM做对话式工作流，在武汉独立开发，偶尔接定制需求。',
    product: {
      name: '需要前端合伙人/外包',
      tagline: '寻找能长期合作的React前端，共同打磨SaaS产品',
      description: '我负责后端+产品，需要一个能长期合作的前端开发者，或者靠谱的外包团队。项目：小团队协作SaaS工具，技术栈 Next.js + TailwindCSS，已有设计稿和API文档，优先考虑有SaaS经验的。',
      contentType: 'DEMAND',
      stage: 'LAUNCHED',
      website: null,
    }
  },
  {
    username: 'sucity_walker',
    bio: '知识付费创业者，做AI+教育方向的在线课程，在上海，内容主要在小红书和视频号，正在做第二条产品线。',
    product: {
      name: '寻找内容创作合伙人',
      tagline: '想找一个懂AI工具的内容创作者长期合作',
      description: '我有课程框架和私域流量，缺一个能持续产出高质量内容的创作者。方向：AI工具测评、职场效率提升。分润合作，不需要全职，每周产出2-3条内容即可。有小红书/视频号运营经验优先。',
      contentType: 'DEMAND',
      stage: 'LAUNCHED',
      website: null,
    }
  },
]

async function main() {
  console.log('开始更新演员账号 profile + 创建产品...\n')

  for (const actor of ACTORS) {
    // 1. 找到用户
    const user = await p.user.findUnique({
      where: { username: actor.username },
      select: { id: true, username: true }
    })
    if (!user) {
      console.log(`⚠️  找不到用户: ${actor.username}`)
      continue
    }

    // 2. 更新 profile
    await p.user.update({
      where: { id: user.id },
      data: {
        bio: actor.bio,
        avatar: avatar(actor.username),
        showInPlaza: true,
      }
    })
    console.log(`✅ 更新 profile: ${actor.username}`)

    // 3. 创建产品（先检查是否已存在同名产品，避免重复）
    const existing = await p.project.findFirst({
      where: { ownerId: user.id, name: actor.product.name }
    })
    if (existing) {
      console.log(`   ⏭️  产品已存在，跳过: ${actor.product.name}`)
      continue
    }

    // 生成 slug: username-产品名拼音缩写
    const slug = `${actor.username}-${Date.now()}`
    await p.project.create({
      data: {
        name: actor.product.name,
        slug,
        tagline: actor.product.tagline,
        description: actor.product.description,
        contentType: actor.product.contentType,
        stage: actor.product.stage,
        website: actor.product.website,
        status: 'PUBLISHED',
        ownerId: user.id,
      }
    })
    console.log(`   🚀 创建产品 [${actor.product.contentType}]: ${actor.product.name}`)
  }

  // 统计结果
  const plazaUsers = await p.user.count({ where: { showInPlaza: true } })
  const plazaProjects = await p.project.count({
    where: { status: 'PUBLISHED', owner: { showInPlaza: true } }
  })
  console.log(`\n📊 完成！广场「人」: ${plazaUsers} 个，「产品」: ${plazaProjects} 个`)

  await p.$disconnect()
}

main().catch(e => { console.error(e); p.$disconnect(); process.exit(1) })
