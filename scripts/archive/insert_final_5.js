const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const communities = [
  {
    name: "百度智能云千帆大模型（武汉）创新中心",
    city: "武汉",
    district: "硚口区",
    address: "武汉市硚口区解放大道37号",
    latitude: 30.608269,
    longitude: 114.198391,
    type: "MIXED",
    operator: "百度智能云/硚口区政府",
    contactPhone: "027-83783888",
    description: "百度智能云千帆大模型（武汉）创新中心位于武汉市硚口区解放大道37号，是百度智能云与硚口区政府联合打造的AI大模型应用创新平台。作为武汉市首个大模型主题OPC创新中心，依托百度文心大模型和千帆平台的技术能力，为入驻创业者提供从模型训练到应用落地的全链路支持。\n\n中心聚焦AI大模型应用开发、行业解决方案和智能化升级三大方向，适合有AI产品开发能力、希望借助百度生态资源快速商业化的技术型创始人。硚口区2026年出台的人工智能OPC专项政策提供最高100万元创业扶持资金和免费算力资源。",
    status: "ACTIVE",
    entryFriendly: 3,
    coverImage: "https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/wuhan-baidu-qianfan.jpg",
    focusTracks: ["AI大模型", "智能应用", "行业解决方案"],
    amenities: ["会议室", "路演厅", "5G网络"],
    realTips: [
      "百度千帆平台提供真实的大模型开发环境和算力资源，技术门槛较高但资源扎实",
      "硚口区OPC政策最高100万创业扶持，但需要符合AI方向要求",
      "⚠️ 偏技术导向，纯内容/电商类项目匹配度低"
    ],
    benefits: {
      office: { summary: "创新中心办公空间+五个一服务", items: ["低成本办公空间", "一站式创业服务"] },
      compute: { summary: "百度千帆平台算力+模型工具支持", items: ["百度文心大模型接入", "千帆平台开发环境", "免费算力额度"] },
      funding: { summary: "硚口区最高100万创业扶持资金", items: ["最高100万元创业扶持", "投融资对接服务"] }
    },
    entryInfo: { requirements: ["AI大模型相关技术方向", "有明确产品或解决方案规划"], steps: ["提交项目申请", "技术评审", "入驻签约"], duration: "2-4周" }
  },
  {
    name: "同心OPC创客中心",
    city: "武汉",
    district: "硚口区",
    address: "武汉市硚口区古田四路49号同心健康服务产业园",
    latitude: 30.610441,
    longitude: 114.226250,
    type: "MIXED",
    operator: "同心健康服务产业园",
    contactPhone: "027-83260606",
    description: "同心OPC创客中心位于武汉市硚口区古田四路49号同心健康服务产业园内，是依托大健康产业基础打造的OPC创业孵化空间。园区聚焦AI+大健康、数字医疗和健康科技方向，为入驻创业者提供产业链上下游资源对接和专业孵化服务。\n\n适合在数字医疗、AI辅助诊断、健康管理等方向有技术积累的创始人。园区内已有多家健康科技企业入驻，形成了一定的产业聚集效应。",
    status: "ACTIVE",
    entryFriendly: 4,
    coverImage: "https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/wuhan-tongxin-opc.jpg",
    focusTracks: ["AI+大健康", "数字医疗", "健康科技"],
    amenities: ["会议室", "路演厅", "共享办公区"],
    realTips: [
      "大健康产业园区基础好，有真实的产业链上下游企业可对接",
      "硚口区OPC政策支持力度大，但需要符合健康科技方向",
      "⚠️ 古田片区交通相对不便，适合不依赖市中心区位的创业者"
    ],
    benefits: {
      office: { summary: "产业园内低成本办公空间", items: ["共享办公工位", "独立办公室可选"] },
      funding: { summary: "硚口区OPC创业扶持政策", items: ["投融资对接服务", "创业补贴申请"] }
    },
    entryInfo: { requirements: ["AI+大健康相关方向", "有明确创业项目"], steps: ["提交申请", "项目评审", "入驻"], duration: "1-2周" }
  },
  {
    name: "中开院（硚口）OPC创新社区",
    city: "武汉",
    district: "硚口区",
    address: "武汉市硚口区解放大道65号海尔国际广场8栋17楼",
    latitude: 30.606461,
    longitude: 114.206098,
    type: "MIXED",
    operator: "中开院（武汉）",
    contactPhone: "027-83736888",
    description: "中开院（硚口）OPC创新社区位于武汉市硚口区解放大道65号海尔国际广场，是中开院在武汉落地的OPC创新孵化平台。中开院（中国开发区协会创新研究院）拥有全国开发区和高新区的产业资源网络，能为入驻创业者提供跨区域的产业对接和政策资源。\n\n社区定位数字经济和AI应用方向，依托海尔国际广场的甲级写字楼环境，适合需要商务办公条件和产业资源对接的AI创业者。",
    status: "ACTIVE",
    entryFriendly: 3,
    coverImage: "https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/wuhan-zhongkaiyuan-opc.jpg",
    focusTracks: ["数字经济", "AI应用", "产业创新"],
    amenities: ["会议室", "路演厅", "共享办公区"],
    realTips: [
      "中开院全国开发区资源网络是真实优势，跨区域产业对接有通道",
      "海尔国际广场甲级写字楼，商务环境好但租金相对较高",
      "⚠️ 入驻门槛包含项目评审，纯早期想法可能不匹配"
    ],
    benefits: {
      office: { summary: "海尔国际广场甲级写字楼办公空间", items: ["甲级写字楼环境", "共享办公+独立办公"] },
      funding: { summary: "硚口区OPC政策扶持+中开院资源", items: ["投融资对接", "创业扶持资金申请"] }
    },
    entryInfo: { requirements: ["数字经济或AI应用方向", "有明确商业化路径"], steps: ["提交项目申请", "中开院评审", "签约入驻"], duration: "2-3周" }
  },
  {
    name: "坪山AI未来营",
    city: "深圳",
    district: "坪山区",
    address: "深圳市坪山区龙田街道青铜剑科技大厦15-16层",
    latitude: 22.738119,
    longitude: 114.384694,
    type: "OFFLINE",
    operator: "坪山区科技创新局",
    contactName: "何小兰",
    contactPhone: "0755-84622699",
    description: "坪山AI未来营是深圳市首个正式挂牌的OPC社区，于2026年5月22日开营。由坪山区科技创新局主导，设有两个营区：第一营区位于龙田街道青铜剑科技大厦15-16层，第二营区位于坪山城投智园。\n\n深圳作为AI产业高地，坪山区率先落地OPC政策具有标杆意义。社区聚焦硬科技AI、智能硬件和新能源智能化方向，依托坪山区比亚迪、中芯国际等龙头企业的产业链资源，为AI创业者提供从研发到量产的全链路支持。适合有硬件基础、希望依托深圳供应链优势的AI创始人。",
    status: "ACTIVE",
    entryFriendly: 4,
    coverImage: "https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/pingshan-ai-camp.jpg",
    focusTracks: ["硬科技AI", "智能硬件", "新能源智能化"],
    amenities: ["会议室", "路演厅", "实验室", "共享办公区"],
    realTips: [
      "深圳首个OPC社区，政策先发优势明显，2026年5月刚开营",
      "坪山区有比亚迪、中芯国际等龙头企业，供应链资源是真实壁垒",
      "⚠️ 坪山区位偏远（距南山/福田约1小时车程），适合不依赖市中心的硬科技团队"
    ],
    benefits: {
      office: { summary: "双营区办公空间，含实验室", items: ["青铜剑科技大厦15-16层", "坪山城投智园配套空间", "硬件实验室"] },
      compute: { summary: "深圳市AI算力资源对接", items: ["算力券支持", "AI工具集采"] },
      funding: { summary: "坪山区AI产业扶持政策", items: ["创业扶持资金", "人才补贴", "研发补助"] },
      housing: { summary: "坪山区人才房配套", items: ["人才住房申请通道", "租房补贴"] }
    },
    entryInfo: { requirements: ["AI或智能硬件相关方向", "有技术团队或产品原型"], steps: ["在线申请", "项目评审", "入营签约"], duration: "2-4周" }
  },
  {
    name: "苏州大数据开发者创新中心·OPC生态社区",
    city: "苏州",
    district: "相城区",
    address: "苏州市相城区元和街道嘉元路455号苏州人工智能产业园3楼",
    latitude: 31.377572,
    longitude: 120.642832,
    type: "MIXED",
    operator: "苏州大数据集团",
    contactPhone: "0512-66182726",
    description: "苏州大数据开发者创新中心·OPC生态社区位于苏州市相城区嘉元路455号苏州人工智能产业园3楼，由苏州大数据集团运营。作为苏州市大数据产业生态的核心载体，中心依托苏州工业园区和相城区的数字经济产业基础，为数据开发者和AI创业者提供专业的孵化服务。\n\n社区聚焦大数据应用、AI开发和数据安全方向，适合在数据治理、数据分析、AI模型开发方面有技术能力的创始人。苏州市2026年出台的OPC专项政策提供算力补贴和创业扶持资金。",
    status: "ACTIVE",
    entryFriendly: 3,
    coverImage: "https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/suzhou-da-shuju-chanye-jie-qu.jpg",
    focusTracks: ["大数据应用", "AI开发", "数据安全"],
    amenities: ["会议室", "开放工位", "技术交流空间"],
    realTips: [
      "苏州大数据集团国资背景，数据资源和政府场景对接有真实通道",
      "苏州人工智能产业园聚集了多家AI企业，生态氛围好",
      "⚠️ 相城区距苏州工业园区约30分钟车程，注意区位选择"
    ],
    benefits: {
      office: { summary: "人工智能产业园内专业办公空间", items: ["共享开放工位", "独立办公室可选", "技术交流空间"] },
      compute: { summary: "苏州市算力资源对接", items: ["算力补贴", "数据资源支持"] },
      funding: { summary: "苏州市OPC创业扶持政策", items: ["创业扶持资金", "投融资对接"] }
    },
    entryInfo: { requirements: ["大数据或AI相关技术方向", "有明确产品规划"], steps: ["提交申请", "项目评审", "入驻签约"], duration: "1-3周" }
  }
];

(async () => {
  for (const c of communities) {
    try {
      const r = await p.community.create({ data: c });
      console.log('✅', r.name, '→', r.slug);
    } catch(e) {
      console.log('❌', c.name, e.message.substring(0, 100));
    }
  }
  await p.$disconnect();
})();
