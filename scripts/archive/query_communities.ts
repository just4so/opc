import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const communities = await prisma.community.findMany({
    where: {
      OR: [
        { name: { contains: '秦邮' } },
        { name: { contains: 'Solo3' } },
        { name: { contains: '数智AI' } },
        { name: { contains: '城市书房' } },
        { name: { contains: '北大科技园' } },
        { name: { contains: '光点' } },
        { name: { contains: '西交' } },
        { name: { contains: '算立方' } },
        { name: { contains: '数智谷' } },
        { name: { contains: '星模湾' } },
        { name: { contains: '瑰谷' } },
        { name: { contains: '云启' } },
        { name: { contains: '智萌' } },
        { name: { contains: '苏唱街' } },
        { name: { contains: '智能制造' } },
        { name: { contains: '极客码头' } },
        { name: { contains: '亲橙' } },
        { name: { contains: '模法' } },
        { name: { contains: '栖智' } },
      ]
    },
    select: { id: true, name: true, city: true, contactPhone: true }
  });
  console.log(JSON.stringify(communities, null, 2));
  await prisma.$disconnect();
}
main().catch(console.error);
