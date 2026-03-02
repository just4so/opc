/**
 * 更新社区坐标数据脚本
 * 根据搜索到的实际地址设置坐标
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 社区坐标数据（根据实际地址搜索得到的近似坐标）
const COMMUNITY_COORDINATES: Record<string, { lat: number; lng: number; address?: string }> = {
  // ===== 深圳 (11个) =====
  '模力营': {
    lat: 22.5695, lng: 113.9480,
    address: '南山区西丽街道留仙洞总部基地万科云城六期（云科技大厦）'
  },
  '前海深港青年梦工场': {
    lat: 22.5180, lng: 113.9020,
    address: '前海深港合作区南山街道梦海大道5188号'
  },
  '华强北OPC创新社区': {
    lat: 22.5465, lng: 114.0880,
    address: '福田区华强北街道振华路'
  },
  '罗湖π创空间OPC社区': {
    lat: 22.5580, lng: 114.1150,
    address: '罗湖区笋岗-清水河片区'
  },
  '深圳北站港澳青年创新创业中心': {
    lat: 22.6095, lng: 114.0280,
    address: '龙华区民治街道深圳北站东广场'
  },
  '大公坊AI硬件OPC·Hub': {
    lat: 22.7200, lng: 114.2450,
    address: '龙岗区坂田街道大公坊'
  },
  '模力谷': {
    lat: 22.7280, lng: 114.2380,
    address: '龙岗区坂田街道'
  },
  '天使荟': {
    lat: 22.5420, lng: 114.0650,
    address: '福田区深南中路'
  },
  '宝安硬创OPC社区': {
    lat: 22.5560, lng: 113.8850,
    address: '宝安区新安街道'
  },
  '光引粒·人工智能创想空间': {
    lat: 22.7750, lng: 113.9380,
    address: '光明区光明科学城'
  },
  '璞跃创新中心': {
    lat: 22.5520, lng: 114.1080,
    address: '罗湖区湖贝片区'
  },

  // ===== 北京 (2个) =====
  '中关村AI北纬社区': {
    lat: 40.0820, lng: 116.2780,
    address: '海淀区北清路以北，海淀大悦信息科技园'
  },
  '模数OPC社区': {
    lat: 39.7920, lng: 116.5050,
    address: '北京经开区通明湖信息城（模数世界）'
  },

  // ===== 上海 (3个) =====
  '临港零界魔方': {
    lat: 30.9120, lng: 121.9350,
    address: '临港新片区临港科技城创新魔坊园区'
  },
  '静安视听静界·π空间OPC社区': {
    lat: 31.2350, lng: 121.4520,
    address: '静安区'
  },
  '徐汇超级创业者社区': {
    lat: 31.1850, lng: 121.4380,
    address: '徐汇区'
  },

  // ===== 杭州 (4个) =====
  '鸿鹄汇': {
    lat: 30.2920, lng: 120.2180,
    address: '上城区新塘路融信中心13层'
  },
  '未来数智港': {
    lat: 30.2650, lng: 120.2350,
    address: '上城区彭埠街道中国数谷'
  },
  '数栖湾': {
    lat: 30.2480, lng: 120.1750,
    address: '西湖区'
  },
  '才立方OPC社区': {
    lat: 30.4180, lng: 120.2920,
    address: '临平区'
  },

  // ===== 武汉 (1个) =====
  '武汉滨江亲橙人工智能OPC社区': {
    lat: 30.5720, lng: 114.3480,
    address: '武昌区徐东大街与友谊大道交汇处，武汉阿里中心7楼'
  },

  // ===== 南京 (1个) =====
  '亲橙OPC社区': {
    lat: 32.0180, lng: 118.7150,
    address: '建邺区河西中央科创区，南京阿里中心T5栋'
  },

  // ===== 常州 (3个) =====
  '中国移动（常州）OPC社区': {
    lat: 31.8150, lng: 119.9780,
    address: '常州市新北区'
  },
  '原点空间': {
    lat: 31.8080, lng: 119.9720,
    address: '常州市'
  },
  '硅基智能OPC社区': {
    lat: 31.8200, lng: 119.9850,
    address: '常州市新北区'
  },

  // ===== 苏州 (2个) =====
  '模术空间': {
    lat: 31.2720, lng: 120.7380,
    address: '苏州工业园区'
  },
  '苏州独墅湖青年创新创业港': {
    lat: 31.2650, lng: 120.7450,
    address: '苏州工业园区独墅湖'
  },

  // ===== 无锡 (2个) =====
  '魔方空间': {
    lat: 31.4950, lng: 120.3180,
    address: '无锡国家软件园'
  },
  '鸿山·暖村数字游民村落': {
    lat: 31.6280, lng: 120.3550,
    address: '无锡市新吴区鸿山街道'
  },

  // ===== 成都 (1个) =====
  '天府软件π立方 OPC社区': {
    lat: 30.5450, lng: 104.0680,
    address: '天府新区天府软件园'
  },

  // ===== 广州 (1个) =====
  '广州OPC创业指南': {
    lat: 23.1250, lng: 113.3250,
    address: '广州市天河区'
  },

  // ===== 昆山 (1个) =====
  '昆山AI直播基地': {
    lat: 31.3880, lng: 120.9620,
    address: '昆山市'
  },

  // ===== 青岛 (2个) =====
  '崂山繁星空间OPC社区': {
    lat: 36.1050, lng: 120.4680,
    address: '崂山区科苑纬三路'
  },
  '凤鸣智谷AI漫剧创客中心': {
    lat: 36.3080, lng: 120.3920,
    address: '城阳区凤鸣智谷产业园'
  },

  // ===== 宁波 (2个) =====
  '海曙区AiOPC社区': {
    lat: 29.8720, lng: 121.5520,
    address: '海曙区白云街道'
  },
  'OPC云创Labo社区': {
    lat: 29.8680, lng: 121.5480,
    address: '海曙区白云街道'
  },

  // ===== 厦门 (1个) =====
  '超级合子OPC共生社区': {
    lat: 24.4920, lng: 118.1650,
    address: '思明区软件园二期望海路8号'
  },

  // ===== 福州 (1个) =====
  '福建OPC联盟·仓山AI创业助手平台': {
    lat: 26.0280, lng: 119.3180,
    address: '仓山区互联网小镇'
  },
}

async function updateCoordinates() {
  console.log('开始更新社区坐标...\n')

  let updated = 0
  let notFound = 0

  for (const [name, coords] of Object.entries(COMMUNITY_COORDINATES)) {
    try {
      // 查找社区（支持部分匹配）
      const community = await prisma.community.findFirst({
        where: {
          OR: [
            { name: name },
            { name: { contains: name } },
          ]
        }
      })

      if (community) {
        await prisma.community.update({
          where: { id: community.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng,
            address: coords.address || community.address,
          }
        })
        console.log(`✓ ${name} -> (${coords.lat}, ${coords.lng})`)
        updated++
      } else {
        console.log(`✗ 未找到社区: ${name}`)
        notFound++
      }
    } catch (error) {
      console.error(`✗ 更新失败: ${name}`, error)
    }
  }

  console.log(`\n更新完成！成功: ${updated}, 未找到: ${notFound}`)
}

updateCoordinates()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
