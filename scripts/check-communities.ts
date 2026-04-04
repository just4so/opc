import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const names = [
    '武汉滨江亲橙人工智能OPC社区',
    '花果山下人工智能OPC社区',
    '数智文旅OPC社区',
    '茂林学村城乡OPC俱乐部',
    '超级合子OPC共生社区',
    '崂山繁星空间OPC社区',
    '凤鸣智谷AI漫剧创客中心',
    '广州OPC创业指南',
    'OPC服务中心和服务联盟',
    'AIGC创意园OPC社区',
    '创新谷',
    '壹仁创新社区',
    '福建OPC联盟·仓山AI创业助手平台',
    '模立方社区',
    '昆山AI直播基地',
    '相豫OPC社区',
    '广西AI+电商OPC孵化基地',
    '伊州开物智坊',
    '玉智OPC社区'
  ];
  const results = await p.community.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true, city: true, contactPhone: true }
  });
  console.log(JSON.stringify(results, null, 2));
  await p.$disconnect();
}

main().catch(console.error);
