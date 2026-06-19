const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BMAP_KEY = "FQzkylSnpUFXhoz2fXqc3FKlNTIngX9h";

async function geocode(address) {
  const url = `https://api.map.baidu.com/geocoding/v3/?address=${encodeURIComponent(address)}&output=json&ak=${BMAP_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status === 0 && data.result) {
    return {
      latitude: data.result.location.lat,
      longitude: data.result.location.lng
    };
  }
  console.log("  API响应:", JSON.stringify(data));
  return null;
}

async function updateCoordinates(city) {
  const communities = await prisma.community.findMany({
    where: {
      city: city,
      latitude: null
    }
  });

  console.log(`\n=== ${city}社区坐标更新 ===`);
  console.log(`需要更新坐标的社区: ${communities.length} 个\n`);

  let updated = 0;
  let failed = 0;

  for (const c of communities) {
    // 构建完整地址
    let fullAddress = c.address;
    if (c.address === "-" || !c.address) {
      fullAddress = `${city}${c.district || ""}${c.name}`;
    } else if (!c.address.includes(city)) {
      fullAddress = `${city}${c.district || ""}${c.address}`;
    }

    console.log(`处理: ${c.name}`);
    console.log(`  地址: ${fullAddress}`);

    const coords = await geocode(fullAddress);
    if (coords) {
      await prisma.community.update({
        where: { id: c.id },
        data: coords
      });
      console.log(`  坐标: ${coords.latitude}, ${coords.longitude} ✓`);
      updated++;
    } else {
      console.log(`  获取坐标失败 ✗`);
      failed++;
    }

    // 避免请求过快
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n${city}更新完成: 成功 ${updated}, 失败 ${failed}`);
  return { updated, failed };
}

async function main() {
  const city = process.argv[2] || "上海";
  await updateCoordinates(city);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
