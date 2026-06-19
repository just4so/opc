import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // 独墅湖青年创新创业港: 0512-62607125 (来源: sipac.gov.cn suzhou.gov.cn)
  const r1 = await p.community.updateMany({
    where: { name: '苏州独墅湖青年创新创业港' },
    data: { contactPhone: '0512-62607125' }
  });
  console.log('独墅湖青年创新创业港:', r1.count, 'updated');
  
  await p.$disconnect();
}

main().catch(console.error);
