import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const results = await p.community.findMany({
    where: { name: { in: ['武汉滨江亲橙人工智能OPC社区', '花果山下人工智能OPC社区'] } },
    select: { name: true, city: true, contactPhone: true }
  });
  console.log(JSON.stringify(results, null, 2));
  await p.$disconnect();
}

main().catch(console.error);
