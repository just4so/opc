import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.community.updateMany({
    where: { name: '亲橙OPC社区' },
    data: { contactPhone: '400-9030-969' },
  });
  await prisma.community.updateMany({
    where: { name: '极客码头' },
    data: { contactPhone: '025-58682068' },
  });
  await prisma.community.updateMany({
    where: { name: '模法学院' },
    data: { contactPhone: '025-58682068' },
  });

  const verify = await prisma.community.findFirst({
    where: { name: '亲橙OPC社区' },
    select: { name: true, city: true, contactPhone: true },
  });
  console.log(JSON.stringify(verify, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
