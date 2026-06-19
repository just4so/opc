import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // 青苔设计OPC社区: 0512-86660051 (来源: qingtaidesign.com 苏州设计服务平台)
  const r1 = await p.community.updateMany({
    where: { name: '青苔设计OPC社区' },
    data: { contactPhone: '0512-86660051' }
  });
  console.log('青苔设计OPC社区:', r1.count, 'updated');
  
  await p.$disconnect();
}

main().catch(console.error);
