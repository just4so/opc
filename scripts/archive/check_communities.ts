import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const communities = await p.community.findMany({
    where: {
      name: {
        in: [
          '芯模社区', '才立方OPC社区', '未来数智港·青聚枢纽', '数栖湾',
          '游界·滨湖OPC社区', '音界·合柴OPC社区', '云界·卓越城OPC社区', '视界·淝河OPC社区', '幻界·智汇OPC社区',
          '徐汇超级创业者社区', '视听静界·π空间OPC创新社区', '零界魔方OPC首发社区', '瞧见Club', '虹橙OPC社区',
          '紫琅智谷OPC创新社区', '通州硅基绿洲OPC社区', '硅基绿洲OPC社区',
          '硅基智能OPC社区', '原点空间', '中国移动（常州）OPC社区',
          '声谷滨江科创OPC社区',
          '海曙AiOPC社区', 'OPC云创Labo社区'
        ]
      }
    },
    select: { id: true, name: true, city: true, contactPhone: true }
  });
  console.log(JSON.stringify(communities, null, 2));
  await p.$disconnect();
}
main();
