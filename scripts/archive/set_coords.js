const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// 经纬度来源：各城市知名地标/园区坐标，精确到区级（地图定位够用）
const data = [
  { name: '两江新区星运人工智能OPC社区',  address: '重庆市两江新区礼嘉智慧城',               lat: 29.6231, lng: 106.5923 },
  { name: '仙桃数据谷OPC创业社区',        address: '重庆市渝北区仙桃国际大数据谷',           lat: 29.7248, lng: 106.6386 },
  { name: '淼老板OPC创业社区',            address: '重庆市渝中区解放碑商圈',                 lat: 29.5638, lng: 106.5784 },
  { name: '西安人工智能OPC创新社区',      address: '西安市高新区软件新城',                   lat: 34.2088, lng: 108.8806 },
  { name: '西安明德理工学院OPC创新社区',  address: '西安市鄠邑区明德理工学院',               lat: 34.0819, lng: 108.6043 },
  { name: '天开和平园OPC模创社区',        address: '天津市和平区天开高教科创园',             lat: 39.1012, lng: 117.2064 },
  { name: '大泽湖OPC创业中心',            address: '长沙市望城区大泽湖海归小镇',             lat: 28.3965, lng: 112.8203 },
  { name: '长沙经开区满天星OPC创新基地',  address: '长沙市经济技术开发区星沙',               lat: 28.2276, lng: 113.0529 },
  { name: '佛山市创业孵化示范基地OPC社区',address: '佛山市禅城区汾江南路创业大厦',           lat: 23.0126, lng: 113.1219 },
  { name: '辽宁数智创新OPC联盟生态基地',  address: '沈阳市沈北新区虎石台大道',               lat: 41.9285, lng: 123.4683 },
  { name: '沈阳企商链OPC创业社区',        address: '沈阳市皇姑区北站路财富中心B座',           lat: 41.8082, lng: 123.4278 },
  { name: '山西新质出海OPC社区',          address: '太原市晋源区晋祠路数智流量园',            lat: 37.7281, lng: 112.5004 },
  { name: '昆明AI青创空间OPC社区',        address: '昆明市西山区滇池路庾园社区',             lat: 24.8756, lng: 102.7183 },
  { name: '海口龙华区特色OPC创业社区',    address: '海口市龙华区龙昆南路创业园',             lat: 20.0443, lng: 110.3208 },
  { name: '琶洲元创·OPC社区',            address: '广州市海珠区新港东路琶洲会展区',          lat: 23.1083, lng: 113.3775 },
  { name: '粤港澳OPC港澳服务社区',        address: '广州市天河区珠江新城花城大道',            lat: 23.1218, lng: 113.3246 },
  { name: '黄埔TOKEN 8条OPC社区',         address: '广州市黄埔区云埔工业区开创大道',          lat: 23.1652, lng: 113.4738 },
  { name: '智核南沙·一人领创AI社区',     address: '广州市南沙区蕉门河中心区灵山岛',         lat: 22.7946, lng: 113.5312 },
  { name: '蓉数OPC创业社区',              address: '成都市高新区天府大道北段天府国际金融中心', lat: 30.5481, lng: 104.0663 },
];

async function main() {
  let ok = 0;
  for (const d of data) {
    const c = await p.community.findFirst({ where: { name: d.name } });
    if (!c) { console.log('❓ 找不到:', d.name); continue; }
    await p.community.update({
      where: { id: c.id },
      data: { address: d.address, latitude: d.lat, longitude: d.lng }
    });
    ok++;
    process.stdout.write('✅');
  }
  console.log('\n完成:', ok, '条');
  await p.$disconnect();
}
main();
