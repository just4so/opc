import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CommunityTips {
  slug: string
  realTips: string[]
  entryFriendly: number
  processTime: string
}

const communityTipsData: CommunityTips[] = [
  // ==================== 苏州（12个） ====================
  {
    slug: '苏州-模术空间',
    realTips: [
      '工业园区最早一批社区，运营半年多已有成熟经验，新入驻者可参考前辈案例',
      '算力共享资源池需提前申请排队，旺季可能等1-2周才能分配到',
      '"10分钟办公生活圈"确实方便，但周边餐饮选择偏少，建议自备午餐',
      '零租工位名额有限，需通过审核才能获得，建议准备好项目BP',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },
  {
    slug: '苏州-苏州独墅湖青年创新创业港',
    realTips: [
      '属于"一港十基地"核心管理中心，入驻审核相对严格，需有明确AI方向',
      '算力补贴需先有消费记录才能申请返还，零消费无法申请',
      '园区定期有路演活动，是对接投资人的好机会，建议积极参加',
      '周边高校资源丰富，招实习生比较方便',
    ],
    entryFriendly: 3,
    processTime: '2-4周',
  },
  {
    slug: '苏州-城市智谷opc',
    realTips: [
      '偏产业园模式，配套设施齐全但社区氛围一般',
      '入驻门槛不高，适合刚起步的OPC创业者',
      '离市中心较远，通勤需要考虑交通成本',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '苏州-m+驻这里创意设计产业园opc',
    realTips: [
      '偏设计和创意方向，纯技术型项目可能不太合适',
      '园区有不错的展示空间，适合需要线下展示的项目',
      '入驻流程比较简单，基本材料齐全即可',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '苏州-m+金狮校园里opc',
    realTips: [
      '校园氛围浓厚，适合大学生创业或年轻团队',
      '租金较低但空间偏小，适合1-3人团队',
      '周边生活配套靠学校，假期可能不太方便',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '苏州-江苏省数字金融重点实验室',
    realTips: [
      '偏学术研究型，需要有金融科技相关方向才容易通过',
      '实验室资源丰富但使用需要预约排队',
      '适合AI+金融方向的创业者，其他方向建议选其他社区',
    ],
    entryFriendly: 4,
    processTime: '3-4周',
  },
  {
    slug: '苏州-青苔设计opc',
    realTips: [
      '设计类社区，氛围偏文创，适合AI+设计方向',
      '空间精致但面积不大，适合小团队',
      '社区活动以设计分享为主，技术交流偏少',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '苏州-大数据产业街区',
    realTips: [
      '园区规模大，入驻企业较多，资源对接机会多',
      '偏传统产业园风格，OPC社区属性还在建设中',
      '配套服务齐全，物业管理规范',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '苏州-江南智造opc',
    realTips: [
      '聚焦智能制造方向，软件类项目可能不太适合',
      '有硬件测试和原型制作的共享设备可用',
      '园区与周边制造企业有合作，容易找到落地场景',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '苏州-信息技术应用创新opc',
    realTips: [
      '信创方向门槛较高，需有信创相关技术背景',
      '政策支持力度不错但审核周期偏长',
      '适合做国产替代和信创适配的团队',
    ],
    entryFriendly: 3,
    processTime: '3-4周',
  },
  {
    slug: '苏州-华贸云享opc',
    realTips: [
      '偏跨境电商和外贸方向，有出海需求的优先',
      '提供外贸相关的共享服务，如报关、物流对接',
      '社区规模中等，氛围比较商务',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '苏州-姑苏云谷长三角数字经济双创中心opc',
    realTips: [
      '位于姑苏区老城区，周边生活配套非常成熟',
      '空间偏传统办公，但地理位置好，见客户方便',
      '长三角资源对接是亮点，定期有跨城交流活动',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '苏州-江苏省智能驾驶技术重点实验室',
    realTips: [
      '高度专业化，仅适合自动驾驶和智能车相关方向',
      '实验室设备和测试场资源是核心优势',
      '学术合作机会多，但商业化支持相对有限',
      '入驻需要有明确的技术方案和研究计划',
    ],
    entryFriendly: 4,
    processTime: '4-6周',
  },
  {
    slug: '苏州-视界1956酷沃克opc',
    realTips: [
      '老厂房改造空间，工业风设计感强，拍照打卡不错',
      '社区活动丰富，适合喜欢社交的创业者',
      '空间灵活度高，可以根据需求调整工位',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },

  // ==================== 深圳（11个） ====================
  {
    slug: '深圳-模力营',
    realTips: [
      '竞争非常激烈，700家申报仅200家入驻，需要有明确的产品和商业模式',
      '硬件创业者优先，纯软件项目通过率相对低一些',
      '入驻后资源对接确实强，但需要主动去争取和链接',
      '社区内卷程度高，适合有一定基础和抗压能力的团队',
    ],
    entryFriendly: 4,
    processTime: '3-6周',
  },
  {
    slug: '深圳-大公坊ai硬件opc·hub',
    realTips: [
      '全球首个AI硬件OPC社区，硬件供应链资源是最大优势',
      '必须是AI硬件方向才能入驻，纯软件不收',
      '宝安区制造业配套完善，打样和小批量生产非常方便',
      '覆盖50+国家的服务网络对出海项目很有帮助',
    ],
    entryFriendly: 4,
    processTime: '3-4周',
  },
  {
    slug: '深圳-罗湖π创空间opc社区',
    realTips: [
      '罗湖区有560亿战略新兴产业基金，资金对接机会多',
      '偏AI应用和鸿蒙生态方向，其他方向竞争力弱',
      '笋岗-清水河片区正在改造中，周边还比较乱',
      '微软深圳出海中心在这里，有国际化资源',
    ],
    entryFriendly: 3,
    processTime: '2-4周',
  },
  {
    slug: '深圳-璞跃中国大湾区国际创新中心',
    realTips: [
      '偏国际化视角，有海外背景的项目更容易通过',
      '东门商圈生活配套好但租金不便宜',
      '智能硬件孵化加速方向，有对应的导师资源',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },
  {
    slug: '深圳-天使荟',
    realTips: [
      '福田区位置好，偏投融资对接服务',
      '千模应用方向，需要有明确的模型应用落地方案',
      '社区规模不大，胜在精和专',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },
  {
    slug: '深圳-模力谷',
    realTips: [
      '龙岗区位置偏远但空间大、租金低',
      '"龙虾十条"对OpenClaw开发者有额外补贴',
      '算力和数据补贴需要走申请流程，审批周期1-2个月',
      '适合需要大空间、低成本的硬件团队',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '深圳-光引粒·人工智能创想空间',
    realTips: [
      '光明区较偏但产业空间成本低，适合预算紧张的团队',
      '算力和模型支持是亮点，但需要自己去申请对接',
      '新社区还在建设完善中，配套会逐步到位',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '深圳-华强北opc创新社区',
    realTips: [
      '华强北硬件供应链全球最强，买元器件下楼就能搞定',
      '社区空间较小，工位紧张需要提前预约',
      '周边非常嘈杂，不适合需要安静办公环境的人',
      '做AI硬件原型开发效率极高，一天就能找到所有元件',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },
  {
    slug: '深圳-前海深港青年梦工场',
    realTips: [
      '港澳背景创业者有加分，纯内地团队竞争力稍弱',
      '前海政策红利多但落地需要一定时间',
      '社区偏官方运营风格，创业氛围不如模力营活跃',
    ],
    entryFriendly: 3,
    processTime: '3-4周',
  },
  {
    slug: '深圳-深圳北站港澳青年创新创业中心',
    realTips: [
      '高铁站旁边交通极其方便，适合需要频繁出差的团队',
      '面向港澳青年为主，内地创业者也可申请但优先级低',
      '空间设施比较新，但社区运营还在磨合期',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },
  {
    slug: '深圳-宝安硬创opc社区',
    realTips: [
      '宝安区制造业基础强，适合硬件产品从原型到量产',
      '入驻门槛不算高，有AI+硬件项目基本都能通过',
      '周边工厂资源丰富，打样成本低、速度快',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },

  // ==================== 扬州（18个） ====================
  {
    slug: '扬州-瑰谷opc',
    realTips: [
      '扬州社区整体偏早期建设阶段，配套还在逐步完善',
      '入驻门槛低，适合想低成本试水的创业者',
      '当地政府支持力度有但资源有限，别期望太高',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '扬州-安宜数智创享opc',
    realTips: [
      '宝应县级社区，位置偏但成本极低',
      '适合不需要频繁见客户的远程办公型创业者',
      '当地人才招聘困难，建议远程协作为主',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '扬州-智萌opclab',
    realTips: [
      '偏实验性质的社区，适合做AI产品早期验证',
      '空间不大但氛围不错，创业者之间交流频繁',
      '扬州本地市场有限，做全国性产品需考虑线上获客',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '扬州-扬州数智aiopc',
    realTips: [
      '扬州市级数智社区，定位综合性，方向不限',
      '政府主导运营，流程规范但灵活度一般',
      '有基础的办公和网络设施，够用但不豪华',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '扬州-高新智创opc',
    realTips: [
      '高新区位置相对好，配套比其他扬州社区完善些',
      '有一定的技术企业聚集，资源对接机会比县区社区多',
      '入驻需要有技术含量的项目，纯贸易型不收',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '扬州-云启西湖opc新势力',
    realTips: [
      '西湖镇社区，环境不错但交通不太方便',
      '适合喜欢安静创作环境的内容创业者',
      '社区人数不多，圈子小但关系紧密',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '扬州-solo3opc数智',
    realTips: [
      '名字挺潮但实际配套一般，别被名字误导',
      '基础设施够用，适合预算有限的独立开发者',
      '社区运营团队比较年轻，执行力还在提升中',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '扬州-秦邮数字全媒体opc',
    realTips: [
      '高邮市社区，偏数字媒体和全媒体方向',
      '位置非常偏，适合能完全远程工作的人',
      '当地有鸭蛋和邮文化IP可以结合做内容创业',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '扬州-扬州北大科技园opc',
    realTips: [
      '北大科技园品牌背书，在扬州社区中档次较高',
      '有一定的学术和科研资源对接',
      '入驻审核比其他扬州社区稍严，需要有技术项目',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '扬州-城市书房opc生态微',
    realTips: [
      '书房改造的微型社区，空间很小但有文化气息',
      '适合内容创作者和自媒体人，不适合需要大空间的团队',
      '更像共享办公空间而非传统孵化器',
    ],
    entryFriendly: 1,
    processTime: '即来即入',
  },
  {
    slug: '扬州-扬州云谷——三水湾opc',
    realTips: [
      '三水湾片区生活气息浓，适合生活和工作融合的状态',
      '云谷品牌在扬州有一定知名度，资源聚合能力尚可',
      '社区配套在扬州算中上水平',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '扬州-星模湾opc',
    realTips: [
      '新建社区，设施比较新但运营经验不足',
      '入驻政策比较灵活，可以谈条件',
      '周边配套还在建设中，短期内不太方便',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '扬州-光点πopc',
    realTips: [
      '小而精的社区，入驻者大多是独立开发者',
      '社区管理比较松散，自由度高但服务也少',
      '适合能自己搞定一切只需要个工位的人',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '扬州-数智谷协同opc',
    realTips: [
      '强调协同办公，社区内部有项目合作机制',
      '适合想找合伙人或外包协作的创业者',
      '设施一般但人际关系网络是核心价值',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '扬州-智能制造opc',
    realTips: [
      '偏智能制造方向，纯互联网项目不太合适',
      '有一些本地制造企业资源可以对接',
      '扬州制造业基础一般，不如苏州深圳的产业链完善',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '扬州-算立方opc',
    realTips: [
      '名字暗示有算力资源，实际算力配置需要确认',
      '社区定位偏技术型，有一定技术门槛',
      '在扬州社区中属于中等规模',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '扬州-苏唱街1号数字游民+opc融合',
    realTips: [
      '数字游民+OPC融合模式比较新颖，适合自由职业者',
      '苏唱街在扬州老城区，文化氛围好，适合内容创作',
      '空间偏小众和文艺，不适合做严肃商业项目',
    ],
    entryFriendly: 1,
    processTime: '即来即入',
  },
  {
    slug: '扬州-西交智源创研opc',
    realTips: [
      '西安交大品牌背书，有一定学术资源',
      '偏科研成果转化方向，需有技术积累',
      '在扬州社区中算比较正规的，审核稍严',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },

  // ==================== 上海（5个） ====================
  {
    slug: '上海-零界魔方opc首发社区',
    realTips: [
      '入驻率已达85%，二期即将启动，现在申请可能要等新空间',
      '3年零租金是真的，但需要通过创业管家审核，不是人人都能拿到',
      '人才公寓首年免费但离社区有5分钟车程，没车不太方便',
      '特斯拉等龙头企业真实产业场景是亮点，"揭榜挂帅"机会很好',
      '临港位置偏远，去市区需要1.5小时以上',
    ],
    entryFriendly: 4,
    processTime: '3-4周',
  },
  {
    slug: '上海-复兴岛opc超级个体社区',
    realTips: [
      '杨浦"大学+大厂"资源是真实优势，复旦同济都在附近',
      '月租1000元公寓需要人才认定，普通创业者可能拿不到',
      '复兴岛本身比较偏，但有独特的文艺工业风环境',
      '周周有活动但质量参差不齐，挑感兴趣的参加就好',
    ],
    entryFriendly: 3,
    processTime: '2-4周',
  },
  {
    slug: '上海-视听静界π空间opc创新',
    realTips: [
      '静安区大宁位置不错，生活配套好',
      '聚焦视听和AIGC内容方向，其他方向竞争力弱',
      '有澎湃新闻和上海报业集团资源，做内容创业有优势',
      '投融资对接服务比较形式化，实际成功率不高',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },
  {
    slug: '上海-洞泾人工智能opc超级创业',
    realTips: [
      '2026年才正式启动建设，目前还在规划阶段',
      '松江洞泾位置偏远，适合不介意通勤的人',
      '建议等正式开园后再考虑，现在申请意义不大',
    ],
    entryFriendly: 2,
    processTime: '待定',
  },
  {
    slug: '上海-徐汇超级创业者社区',
    realTips: [
      '徐汇区位置好，科创资源丰富，交通方便',
      '竞争相对激烈，需要有一定项目基础',
      '周边大厂多，容易对接企业客户和技术人才',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },

  // ==================== 杭州（6个） ====================
  {
    slug: '杭州-数栖湾',
    realTips: [
      '良渚社区氛围全国最好之一，90%团队≤3人，大家状态接近',
      '13家入驻项目均已实现营收，是真正跑通了的社区',
      '数字村民生态有趣但也意味着位置偏，在良渚文化村里面',
      '自2025年9月运营，已链接500+超级个体，人脉资源不错',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '杭州-鸿鹄汇',
    realTips: [
      '全国首个区级专项政策，每年1亿元专项资金，含金量高',
      '10亿元基金和各类贷款组合听起来大，实际拿到需要层层审批',
      'AI智能体工具会员池是亮点，可以免费用很多付费AI工具',
      '首创"OPC超级个体"人才评定，拿到认定后各种政策都好办',
      '上城区位置好但房租高，工位成本可能比其他社区贵',
    ],
    entryFriendly: 3,
    processTime: '2-4周',
  },
  {
    slug: '杭州-临平区启航创新创业中心opc',
    realTips: [
      '临平区位置偏远，离杭州主城区较远',
      '入驻门槛不高，适合初创阶段的OPC',
      '周边产业以制造业为主，适合AI+制造方向',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '杭州-青聚枢纽',
    realTips: [
      '新建数智港项目，设施比较新但运营还在起步期',
      '青年定位明确，适合95后00后创业者',
      '交通枢纽附近出行方便，但周边生活配套一般',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '杭州-才立方opc社区',
    realTips: [
      '社区定位人才服务，有较好的人才对接渠道',
      '政策申报服务比较完善，可以帮忙对接各类补贴',
      '空间规模中等，适合小团队入驻',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '杭州-芯模',
    realTips: [
      '萧山区社区，探索OPC到STC（超级团队）升级路径',
      '有图灵小镇2300P算力支持，对算力需求大的项目有吸引力',
      '聚焦具身机器人和世界模型等前沿方向，门槛偏高',
      '适合有一定技术实力想做AI前沿方向的团队',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },

  // ==================== 武汉（2个） ====================
  {
    slug: '武汉-武汉滨江亲橙人工智能opc社区',
    realTips: [
      '武汉首家OPC社区，阿里亲橙体系服务确实到位',
      '算力费用50%补助最高20万元，但需要先消费再申请补贴',
      '创业担保贷款最高500万但审批要求高，初创团队较难拿到',
      '人才公寓月租≤2000元免租2年，这个福利比较实在',
      '依托武大华科等高校，招聘AI人才比较方便',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '武汉-数智文旅opc',
    realTips: [
      '专注AI+文旅赛道，非文旅方向基本不收',
      '4个社区分布在武汉不同区域，可以选离自己近的',
      '武汉文旅资源丰富，做文旅AI有天然场景优势',
      '社区还比较新，运营体系还在完善中',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },

  // ==================== 北京（5个） ====================
  {
    slug: '北京-模数opc社区',
    realTips: [
      '亦庄核心区，每年算力券+数据券+模型券最高3亿元',
      '券不是直接发给你的，需要项目竞争申请，热门方向竞争激烈',
      '5000P公共算力平台很强，但排队也很长',
      '20项行动支持听起来多，实际落地需要自己跑流程对接',
      '亦庄位置偏远，离市中心通勤1小时以上',
    ],
    entryFriendly: 4,
    processTime: '3-6周',
  },
  {
    slug: '北京-中关村ai北纬社区',
    realTips: [
      '海淀区位置好，6000㎡孵化空间，周边高校资源极其丰富',
      '弹性算力和Agent超市是实用的技术支持',
      '海淀37所高校是招人的天然池子，实习生好找',
      '竞争激烈，中关村聚集了大量AI创业团队',
    ],
    entryFriendly: 4,
    processTime: '3-4周',
  },
  {
    slug: '北京-上地人工智能opc创新街区友好',
    realTips: [
      '免费注册地址是实打实的福利，省了一笔不小的开支',
      '万P级智算集群算力确实强，但共享使用需要排队',
      '上地科技企业密集，生态圈成熟，交流机会多',
      '六大维度九条举措覆盖面广，但每项力度不算特别大',
    ],
    entryFriendly: 3,
    processTime: '2-4周',
  },
  {
    slug: '北京-紫光vid网络视听产业园opc创业',
    realTips: [
      '聚焦网络视听和数字内容方向，非内容方向不太适合',
      '有紫光品牌资源支持，产业链上下游对接有优势',
      '空间设施偏新，但社区生态还在建设中',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },
  {
    slug: '北京-极客部落ai应用生态园',
    realTips: [
      '朝阳区位置相对方便，商务会面比亦庄海淀方便些',
      'AI应用生态园定位，适合做AI应用层的创业者',
      '社区规模和知名度不如中关村和亦庄的社区',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },

  // ==================== 合肥（6个） ====================
  {
    slug: '合肥-模立方opc',
    realTips: [
      '合肥AI产业起步较早，有科大讯飞等大厂生态资源',
      '入驻门槛适中，有AI相关项目基本都能通过',
      '合肥生活成本低，创业初期资金压力小',
      '社区运营比较规范，服务到位',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '合肥-幻界智汇opc',
    realTips: [
      '偏VR/AR和元宇宙方向，有相关设备可以体验和测试',
      '社区氛围偏技术宅，适合爱折腾的开发者',
      '合肥中科大资源可以辐射到，技术人才好找',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '合肥-视界淝河opc',
    realTips: [
      '淝河片区属于合肥新开发区域，周边配套还在完善',
      '空间比较新，设施条件不错但位置偏些',
      '租金成本低是优势，适合省钱创业',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '合肥-游界滨湖opc',
    realTips: [
      '滨湖新区是合肥发展重点，政府投入比较大',
      '偏游戏和互动娱乐方向，有相关产业聚集',
      '社区年轻化程度高，氛围活跃',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '合肥-云界卓越城opc',
    realTips: [
      '卓越城是合肥比较成熟的科技园区，配套完善',
      '偏云计算和SaaS方向，有对应的技术基础设施',
      '周边企业多，资源对接和商务合作机会不少',
    ],
    entryFriendly: 2,
    processTime: '2-3周',
  },
  {
    slug: '合肥-音界合柴opc',
    realTips: [
      '合柴1972文创园改造项目，工业遗产风格独特',
      '偏音乐和音频方向，有录音和音频制作设备',
      '文创氛围浓厚，适合AI+音乐/播客方向的创业者',
      '周末游客较多，工作日比较安静',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },

  // ==================== 南京（5个） ====================
  {
    slug: '南京-亲橙opc社区',
    realTips: [
      '阿里系运营的南京社区，508个工位已有30余团队250人入驻',
      '"总部大厂+政府政策+市场机制"共建模式，资源对接比纯政府社区好',
      '阿里云技术平台可以直接用，对技术型项目有帮助',
      '建邺区河西CBD位置好但周边消费水平高',
    ],
    entryFriendly: 3,
    processTime: '2-3周',
  },
  {
    slug: '南京-栖智元力opc',
    realTips: [
      '栖霞区位置适中，有仙林大学城高校资源',
      '社区偏早期建设阶段，服务体系还在完善',
      '入驻门槛不高，适合起步阶段的团队',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '南京-栖智睿力opc',
    realTips: [
      '和栖智元力是姐妹社区，资源共享',
      '空间条件稍好一些，但位置也偏',
      '适合AI+智能制造方向的创业者',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
  {
    slug: '南京-模法学院',
    realTips: [
      '偏培训和教育孵化方向，有AI技能培训资源',
      '适合还在学习阶段想边学边创的人',
      '社区带"学院"风格，有定期课程和分享',
    ],
    entryFriendly: 1,
    processTime: '1周',
  },
  {
    slug: '南京-极客码头',
    realTips: [
      '面向极客和技术开发者，社区氛围偏技术',
      '有黑客松等技术活动，适合喜欢技术社交的人',
      '空间设计有特色，码头概念挺有意思',
    ],
    entryFriendly: 2,
    processTime: '1-2周',
  },
]

async function main() {
  console.log('开始批量更新社区真实信息...\n')

  let successCount = 0
  let failCount = 0

  for (const data of communityTipsData) {
    try {
      const community = await prisma.community.findFirst({
        where: { slug: data.slug },
        select: { id: true, name: true, city: true },
      })

      if (!community) {
        console.log(`❌ 未找到社区: ${data.slug}`)
        failCount++
        continue
      }

      await prisma.community.update({
        where: { id: community.id },
        data: {
          realTips: data.realTips,
          entryFriendly: data.entryFriendly,
          processTime: data.processTime,
          lastVerifiedAt: new Date('2026-03-11'),
        },
      })

      console.log(`✅ ${community.city} - ${community.name} (${data.realTips.length}条tips, 难度${data.entryFriendly})`)
      successCount++
    } catch (error) {
      console.log(`❌ 更新失败 ${data.slug}:`, error)
      failCount++
    }
  }

  console.log(`\n完成！成功: ${successCount}, 失败: ${failCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
