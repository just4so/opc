const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const communities = [
  {
    name: '"创享蓝海"孵化器',
    slug: 'chuangxiang-lanhai-incubator',
    city: '佛山',
    district: '南海区',
    address: '佛山市南海区桂城街道瀚天科技城A区8号楼14-15楼',
    latitude: 23.034824868263325,
    longitude: 113.18183111902431,
    description: '"创享蓝海"孵化器位于桂城街道瀚天科技城，提供共享工位与独立办公室双轨可选，依托"益企创享"供需匹配平台，提供成果转化、项目申报和融资撮合一站式科技服务。孵化期3年，独立间租金最高100%补贴（第一年）。',
    type: 'OFFLINE',
    status: 'ACTIVE',
    featured: false,
    contactName: '钟先生',
    contactPhone: '13925491731',
    website: null,
    operator: null,
    focusTracks: ['科技服务', 'AI应用', '企业软件'],
    totalArea: null,
    totalWorkstations: null,
    benefits: {
      office: {
        summary: '共享卡位+独立办公室灵活可选，孵化期3年',
        items: [
          '共享工位（敞开式卡位）：开放办公，即租即用',
          '独立间：91㎡、113㎡、141㎡、150㎡、157㎡等多种规格',
          '独立间入孵第一年租金补贴100%，第二年70%，第三年50%'
        ]
      },
      funding: {
        summary: '成果转化/项目申报/融资撮合综合服务',
        items: [
          '协助申报南海区科技创新项目及扶持资金',
          '融资撮合服务，对接投资机构',
          '"益企创享"供需匹配平台资源对接'
        ]
      }
    },
    entryInfo: {
      requirements: [
        '企业成立时间一般不超过24个月，产品处于研发或试销阶段',
        '上年度营业收入一般不超过300万元人民币',
        '符合新一代信息技术、新能源、生物医药、高端装备制造等重点领域',
        '无环境污染或经处理后无污染物排放'
      ],
      steps: [
        '提交申请表、申报书及相关证明材料',
        '孵化器评审（独立间需评审，卡位仅需审核）',
        '评审结果公示公告',
        '通过后与孵化器签订服务协议，完成入驻'
      ],
      duration: '评审周期视批次而定，通常1-2个月'
    },
    entryFriendly: 3,
    realTips: [
      '独立间有24个月成立年限要求，老团队/成熟公司可申请卡位而非独立间',
      '租金补贴须企业在孵，若提前退出可能需归还部分补贴，签约前务必确认条款',
      '位于瀚天科技城，桂城核心园区配套成熟，但停车位有限，日常通勤需提前考虑'
    ],
    amenities: ['共享会议室', '工商注册协助', '网络宽带', '停车场']
  },
  {
    name: '佛山大学国家大学科技园',
    slug: 'foshan-university-national-science-park',
    city: '佛山',
    district: '南海区',
    address: '佛山市南海区狮山镇广云路南海生物医药产业基地',
    latitude: 23.138850976285656,
    longitude: 113.05457976560884,
    description: '佛山大学国家大学科技园是全国139家、广东省6家国家大学科技园之一，位于南海区狮山镇，依托佛山大学计算机与人工智能学院提供技术支持，聚焦智能制造、生物医药等领域，符合条件企业可享共享工位免费（租金每平米减免5元）。',
    type: 'OFFLINE',
    status: 'ACTIVE',
    featured: false,
    contactName: '杨小姐',
    contactPhone: '15622134419',
    website: null,
    operator: '佛山大学',
    focusTracks: ['科技服务', 'AI应用', '先进制造'],
    totalArea: null,
    totalWorkstations: null,
    benefits: {
      office: {
        summary: '符合条件企业共享工位免费，租金每平米减免5元',
        items: [
          '符合条件入驻企业共享工位免费使用',
          '独立办公室租金每平米减免5元',
          '依托大学科技园国家级平台，配套基础设施完善'
        ]
      },
      business: {
        summary: '对接商会协会4家、投资机构2家、高校1所，提供合作渠道',
        items: [
          '合作商会协会4家，帮助企业拓展本地商业网络',
          '合作投资机构2家，支持融资需求',
          '合作高校1所（佛山大学），技术转化渠道'
        ]
      },
      funding: {
        summary: '依托科技园平台申报科技创新项目及政府扶持资金',
        items: [
          '协助申报广东省及佛山市科技创新项目',
          '依托佛山大学计算机与人工智能学院提供技术服务',
          '园区已培育超30家高新技术企业，生态资源丰富'
        ]
      }
    },
    entryInfo: {
      requirements: [
        '完成工商注册或承诺落地南海区',
        '符合智能制造、新材料、电子信息、生物医药等重点领域'
      ],
      steps: [
        '联系运营方（杨小姐 15622134419）了解入驻条件',
        '提交入驻申请及相关材料',
        '审核通过后签订入驻协议',
        '完成工商注册落地手续'
      ],
      duration: '具体周期请联系运营方确认'
    },
    entryFriendly: 3,
    realTips: [
      '坐标精度街道级，待核实；实际位于狮山镇，距桂城主城区约20km，通勤成本较高',
      '国家级科技园平台背书强，适合有技术转化需求的科研团队，轻资产纯AI团队可能更适合桂城社区',
      '入驻门槛待核实，免费共享工位是否需要特定资质请提前电话确认'
    ],
    amenities: ['共享实验室', '工商注册协助', '网络宽带', '餐厅']
  },
  {
    name: 'π社·南海区海外学子归国创业中心',
    slug: 'pi-she-nanhai-overseas-entrepreneurship',
    city: '佛山',
    district: '南海区',
    address: '佛山市南海区丹灶镇仙湖养生路11号',
    latitude: 23.056604889530053,
    longitude: 112.89310566719105,
    description: 'π社·南海区海外学子归国创业中心，以"主题社区+订单赋能"模式服务归国海外创业者。1941㎡空间含19间独立办公室，对接10家制造企业和10家龙头企业资源，提供全生命周期科技金融与政府采购服务，帮助海归创业者实现与南海本地产业链的深度合作。',
    type: 'OFFLINE',
    status: 'ACTIVE',
    featured: false,
    contactName: '游经理',
    contactPhone: '13924894924',
    website: null,
    operator: null,
    focusTracks: ['综合服务', 'AI应用', '科技服务'],
    totalArea: '1941㎡',
    totalWorkstations: null,
    benefits: {
      office: {
        summary: '1941㎡空间，19间独立办公室',
        items: [
          '总空间1941㎡，19间独立办公室可选',
          '位于丹灶镇仙湖养生路，环境优美',
          '适合有实体办公需求的海归创业团队'
        ]
      },
      business: {
        summary: '对接10家制造企业+10家龙头企业，提供真实订单资源',
        items: [
          '对接10家制造企业合作资源',
          '对接10家龙头企业（含佛山建发集团等）非核心业务需求',
          '连接本地企业和海外华商资源，帮助海归创业者拓展市场'
        ]
      },
      funding: {
        summary: '全生命周期科技金融+政府采购渠道服务',
        items: [
          '提供科技金融服务，协助申报政府创业基金',
          '对接政府采购通道，帮助企业获取早期订单',
          '南海区蓝海人才计划：海归团队可申请启动资金及人才公寓补贴'
        ]
      }
    },
    entryInfo: {
      requirements: [
        '面向归国海外学子和海归创业团队',
        '完成工商注册或承诺落地南海区丹灶镇'
      ],
      steps: [
        '联系运营方（游经理 13924894924）了解入驻条件',
        '提交入驻申请及相关材料',
        '审核通过后签订入驻协议',
        '完成工商注册落地手续'
      ],
      duration: '具体周期请联系运营方确认'
    },
    entryFriendly: 3,
    realTips: [
      '位于丹灶镇，距南海主城区约30km，交通相对不便，适合在丹灶有产业资源或有安居计划的创业者',
      '对接的订单资源以本地制造业为主，适合有B端服务能力的团队，纯互联网/AI团队需评估资源匹配度',
      '入驻门槛待核实，是否限定海归身份或仅优先面向海归请提前确认'
    ],
    amenities: ['独立办公室', '会议室', '政务协助', '工商注册']
  },
  {
    name: '超级智能体OPC社区',
    slug: 'super-agent-opc-community',
    city: '佛山',
    district: '南海区',
    address: '佛山市南海区桂城街道人才中心',
    latitude: 23.041431423499215,
    longitude: 113.20399150747319,
    description: '超级智能体OPC社区由沃土钻研坊运营，专注"AI+产业落地"与垂直场景智能体孵化，主攻10人以内轻资产OPC团队。位于桂城街道人才中心，依托全国首个镇街级AI OPC专项政策，助力个体AI创业者快速完成商业闭环。',
    type: 'OFFLINE',
    status: 'ACTIVE',
    featured: false,
    contactName: '许经理',
    contactPhone: '17508404747',
    website: null,
    operator: '沃土钻研坊',
    focusTracks: ['AI应用', '综合服务', '企业软件'],
    totalArea: null,
    totalWorkstations: null,
    benefits: {
      office: {
        summary: '桂城人才中心低成本创业空间，最高3年租金支持',
        items: [
          '轻资产共享办公空间，"拎脑入驻"模式',
          '依托桂城OPC专项政策，最高3年租金支持',
          '专注10人以内轻量级AI团队，配套设施简洁高效'
        ]
      },
      compute: {
        summary: '可申请桂城算力券/语料券/智能券，每企业每年最高20万元',
        items: [
          '桂城智算中心（100P算力），全国首个镇街级',
          '算力券、语料券、智能券补贴，每企业每年最高20万元',
          '华为政企数智化体验中心技术底座支持'
        ]
      },
      funding: {
        summary: '优质项目最高500万元股权投资+1亿元融资风险补偿基金',
        items: [
          '优质AI OPC项目最高可获500万元股权投资',
          '配套1亿元融资风险补偿基金，撬动社会资本',
          '场景订单体系：定期发布政务及龙头企业非核心业务需求'
        ]
      }
    },
    entryInfo: {
      requirements: [
        '面向10人以内轻资产OPC团队',
        '聚焦AI+产业落地、垂直场景智能体孵化方向',
        '完成工商注册或承诺落地南海区'
      ],
      steps: [
        '联系运营方（许经理 17508404747）了解入驻条件',
        '提交入驻申请及相关材料',
        '审核通过后签订入驻协议',
        '完成工商注册落地手续'
      ],
      duration: '具体周期请联系运营方确认'
    },
    entryFriendly: 4,
    realTips: [
      '坐标精度街道级，待核实；人才中心具体楼栋位置需联系许经理确认',
      '该社区是全国OPC政策最密集落地区域之一，政策红利期内进入有先发优势',
      '主攻AI+制造业垂直场景，纯数字内容/SaaS团队可能需评估场景匹配度'
    ],
    amenities: ['共享工位', '会议室', '政务服务', 'WiFi']
  },
  {
    name: '季华实验室科技成果中试孵化基地',
    slug: 'jihua-lab-tech-incubation-base',
    city: '佛山',
    district: '南海区',
    address: '佛山市南海区桂城街道环岛南路28号季华实验室',
    latitude: 23.024914587419286,
    longitude: 113.24506661673391,
    description: '季华实验室科技成果中试孵化基地（A5）由季华实验室全资子公司佛山市季诺科技有限公司运营，超2.3万㎡空间含67间独立办公室，服务300+制造企业和50+龙头企业，每月提供技术培训，依托20所高校人才输送网络，是佛山先进制造领域最重要的科技成果转化平台之一。',
    type: 'OFFLINE',
    status: 'ACTIVE',
    featured: false,
    contactName: '邓先生',
    contactPhone: '13927769800',
    website: 'https://www.jihualab.ac.cn',
    operator: '佛山市季诺科技有限公司',
    focusTracks: ['先进制造', '科技服务', 'AI应用'],
    totalArea: '23000+㎡',
    totalWorkstations: null,
    benefits: {
      office: {
        summary: '超2.3万㎡空间，67间独立办公室，配套中试设施',
        items: [
          '总建筑面积超2.3万平方米（67间独立办公室）',
          '配套中试验证设施，支持硬科技产品研发验证',
          '位于季华实验室核心区，科研氛围浓厚'
        ]
      },
      business: {
        summary: '服务300+制造企业、50+龙头企业，提供真实市场对接',
        items: [
          '已服务300+制造企业，产业资源深厚',
          '对接50+龙头企业合作需求',
          '每月定期技术培训，助力科技成果工程化'
        ]
      },
      funding: {
        summary: '依托省级实验室平台，支持科技成果转化项目申报',
        items: [
          '季华实验室为广东省首批省实验室之一，成果转化权威背书',
          '支持申报省市科技创新及成果转化项目资金',
          '20所高校人才输送网络，持续人才供给'
        ]
      }
    },
    entryInfo: {
      requirements: [
        '面向科技型企业，优先先进制造、机器人、半导体、高端医疗装备等方向',
        '有实质性研发成果或中试转化需求',
        '完成工商注册或承诺落地南海区'
      ],
      steps: [
        '联系运营方（邓先生 13927769800）了解入驻条件',
        '提交入驻申请及相关材料',
        '审核通过后签订入驻协议',
        '完成工商注册落地手续'
      ],
      duration: '具体周期请联系运营方确认'
    },
    entryFriendly: 2,
    realTips: [
      '定位高端科技成果转化，门槛较高，建议有实质性研发成果的团队申请，纯轻资产/AI应用类团队可能不是主要目标群体',
      '依托省级实验室平台，背书强、资源深，但入驻竞争较激烈',
      '每月技术培训和高校人才对接是真实优势，有硬科技研发需求的OPC非常适合'
    ],
    amenities: ['独立办公室', '中试实验室', '会议室', '餐厅', '停车场', '工商注册协助']
  }
];

(async () => {
  const results = [];
  for (const comm of communities) {
    try {
      const existing = await p.community.findFirst({ where: { slug: comm.slug } });
      if (existing) {
        console.log('SKIP (exists):', comm.name, existing.id);
        results.push({ name: comm.name, status: 'exists', id: existing.id, slug: existing.slug });
        continue;
      }
      const r = await p.community.create({
        data: {
          slug: comm.slug,
          name: comm.name,
          city: comm.city,
          district: comm.district,
          address: comm.address,
          latitude: comm.latitude,
          longitude: comm.longitude,
          description: comm.description,
          type: comm.type,
          status: comm.status,
          featured: comm.featured,
          contactName: comm.contactName,
          contactPhone: comm.contactPhone,
          website: comm.website,
          operator: comm.operator,
          focusTracks: comm.focusTracks,
          totalArea: comm.totalArea,
          benefits: comm.benefits,
          entryInfo: comm.entryInfo,
          entryFriendly: comm.entryFriendly,
          realTips: comm.realTips,
          amenities: comm.amenities,
          images: [],
        }
      });
      console.log('OK:', comm.name, r.id, r.slug);
      results.push({ name: comm.name, status: 'created', id: r.id, slug: r.slug });
    } catch (e) {
      console.error('FAIL:', comm.name, e.message);
      results.push({ name: comm.name, status: 'error', error: e.message });
    }
  }
  await p.$disconnect();
  console.log('\n=== SUMMARY ===');
  results.forEach(r => console.log(JSON.stringify(r)));
})();
