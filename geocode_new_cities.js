const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const addressMap = {
  '两江新区星运人工智能OPC社区': { address: '重庆市两江新区礼嘉智慧城', query: '重庆市两江新区礼嘉' },
  '仙桃数据谷OPC创业社区':       { address: '重庆市渝北区仙桃国际大数据谷', query: '重庆仙桃国际大数据谷' },
  '淼老板OPC创业社区':           { address: '重庆市渝中区解放碑商圈', query: '重庆市渝中区解放碑' },
  '西安人工智能OPC创新社区':     { address: '西安市高新区软件新城', query: '西安高新区软件新城' },
  '西安明德理工学院OPC创新社区': { address: '西安市鄠邑区明德理工学院', query: '西安明德理工学院' },
  '天开和平园OPC模创社区':       { address: '天津市和平区天开高教科创园', query: '天津天开高教科创园' },
  '大泽湖OPC创业中心':           { address: '长沙市望城区大泽湖海归小镇', query: '长沙望城区大泽湖海归小镇' },
  '长沙经开区满天星OPC创新基地': { address: '长沙市经济技术开发区星沙', query: '长沙经济技术开发区星沙' },
  '佛山市创业孵化示范基地OPC社区':{ address: '佛山市禅城区创业大厦', query: '佛山禅城区创业孵化基地' },
  '辽宁数智创新OPC联盟生态基地': { address: '沈阳市沈北新区虎石台', query: '沈阳沈北新区' },
  '沈阳企商链OPC创业社区':       { address: '沈阳市皇姑区北站路财富中心', query: '沈阳北站CBD' },
  '山西新质出海OPC社区':         { address: '太原市晋源区晋祠路数智流量园', query: '太原晋源区' },
  '昆明AI青创空间OPC社区':       { address: '昆明市西山区滇池路庾园', query: '昆明西山区庾园' },
  '海口龙华区特色OPC创业社区':   { address: '海口市龙华区海甸岛', query: '海口龙华区' },
  '琶洲元创·OPC社区':           { address: '广州市海珠区新港东路琶洲', query: '广州琶洲人工智能与数字经济试验区' },
  '粤港澳OPC港澳服务社区':       { address: '广州市天河区珠江新城', query: '广州天河区珠江新城' },
  '黄埔TOKEN 8条OPC社区':        { address: '广州市黄埔区云埔工业区开创大道', query: '广州黄埔区云埔工业区' },
  '智核南沙·一人领创AI社区':    { address: '广州市南沙区蕉门河中心区', query: '广州南沙区蕉门河' },
  '蓉数OPC创业社区':             { address: '成都市高新区天府大道天府国际金融中心', query: '成都高新区天府国际金融中心' },
};

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=cn`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'opc-community-geocoder/1.0' } });
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch(e) {}
  return null;
}

async function main() {
  let ok = 0, fail = 0;
  
  for (const [name, info] of Object.entries(addressMap)) {
    const community = await p.community.findFirst({ where: { name } });
    if (!community) { console.log('❓ 找不到:', name); continue; }
    
    // 先更新 address
    await p.community.update({ where: { id: community.id }, data: { address: info.address } });
    
    // Geocode
    const coords = await geocode(info.query);
    if (coords && coords.lat > 15 && coords.lat < 55 && coords.lng > 70 && coords.lng < 140) {
      await p.community.update({
        where: { id: community.id },
        data: { latitude: coords.lat, longitude: coords.lng }
      });
      ok++;
      console.log(`✅ ${name} | ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
    } else {
      fail++;
      console.log(`⚠️  ${name} | geocode 失败，仅更新地址`);
    }
    
    // Nominatim rate limit: 1 req/sec
    await new Promise(r => setTimeout(r, 1100));
  }
  
  console.log(`\n完成: 经纬度成功 ${ok}, 失败 ${fail}`);
  await p.$disconnect();
}
main();
