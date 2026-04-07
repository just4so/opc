const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // 取每个城市第一张已有图片
  const cityImgs = await p.$queryRawUnsafe(`
    SELECT DISTINCT ON (city) city, images[1] as url
    FROM "Community"
    WHERE status = 'ACTIVE' AND array_length(images, 1) > 0
    ORDER BY city, id
  `);

  console.log('城市图片映射:', cityImgs.length, '个城市');
  let total = 0;

  for (const { city, url } of cityImgs) {
    const r = await p.$executeRawUnsafe(
      `UPDATE "Community" SET images = ARRAY[$1]
       WHERE status = 'ACTIVE' AND city = $2
         AND (images IS NULL OR array_length(images, 1) IS NULL)`,
      url, city
    );
    if (r > 0) { console.log('✅', city, r + '条'); total += r; }
  }

  const left = await p.$queryRawUnsafe(
    `SELECT COUNT(*) as cnt FROM "Community" WHERE status='ACTIVE' AND (images IS NULL OR array_length(images,1) IS NULL)`
  );
  console.log('\n更新:', total, '条 | 剩余缺图:', Number(left[0].cnt));
  await p.$disconnect();
}
main();
