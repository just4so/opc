import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cs = await prisma.community.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, city: true, contactPhone: true, realTips: true, description: true },
    orderBy: { city: 'asc' }
  });
  console.log('总数:', cs.length);
  const missing = cs.filter(c => !c.contactPhone || !c.description || !c.realTips || c.realTips.length < 3);
  console.log('待补充:', missing.length);
  const byCity: Record<string, string[]> = {};
  missing.forEach(c => {
    if (!byCity[c.city]) byCity[c.city] = [];
    byCity[c.city].push(c.name + ' | phone:' + (c.contactPhone?'✅':'❌') + ' desc:' + (c.description?'✅':'❌') + ' tips:' + (c.realTips?.length||0));
  });
  Object.entries(byCity).forEach(([city, list]) => {
    console.log(city + '(' + list.length + '):');
    list.forEach(x => console.log(' -', x));
  });
}
main().finally(()=>prisma.$disconnect());
