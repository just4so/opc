import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // 1. 武汉滨江亲橙人工智能OPC社区 - 027-88936947 (来源: ctdsb.net 长江日报)
  const r1 = await p.community.updateMany({
    where: { name: '武汉滨江亲橙人工智能OPC社区' },
    data: { contactPhone: '027-88936947' }
  });
  console.log('武汉滨江亲橙:', r1.count, '条已更新');

  // 2. 花果山下人工智能OPC社区 - 18605188005 (来源: lyg.gov.cn + lyghz.gov.cn 连云港政府)
  const r2 = await p.community.updateMany({
    where: { name: '花果山下人工智能OPC社区' },
    data: { contactPhone: '18605188005' }
  });
  console.log('花果山下人工智能OPC社区:', r2.count, '条已更新');

  await p.$disconnect();
  console.log('完成');
}

main().catch(console.error);
