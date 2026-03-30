const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

const results = require('/Users/wei/Desktop/opc-content/zhihu-result-s20-s22.json');

async function publish() {
  try {
    const s20 = fs.readFileSync('/Users/wei/Desktop/opc-content/zhihu-s20-wuhan.md', 'utf8');
    const s21 = fs.readFileSync('/Users/wei/Desktop/opc-content/zhihu-s21-guangzhou.md', 'utf8');
    const s22 = fs.readFileSync('/Users/wei/Desktop/opc-content/zhihu-s22-xiamen.md', 'utf8');

    const s20Url = results.find(r => r.label.includes('wuhan')).url;
    const s21Url = results.find(r => r.label.includes('guangzhou')).url;
    const s22Url = results.find(r => r.label.includes('xiamen')).url;

    const r1 = await prisma.news.create({
      data: {
        title: '武汉OPC深度攻略：全国唯一三年行动计划、阿里中心一期已满员，这里到底值不值得去？',
        summary: '武汉是目前全国最适合早期OPC冷启动的城市之一，尤其适合技术型独立开发者、AI应用创业者。它把一人公司最痛的三件事——工位、算力、住房——都拿政策打穿了。',
        content: s20,
        url: s20Url,
        source: '知乎专栏',
        category: 'CASE',
        isOriginal: true,
        author: 'OPC创业圈编辑部',
        publishedAt: new Date()
      }
    });
    console.log('✅ Wuhan inserted:', r1.id);

    const r2 = await prisma.news.create({
      data: {
        title: '广州OPC深度攻略：五区政策同时爆发，真正值钱的不是补贴，是场景',
        summary: '广州这波OPC政策，真正有价值的地方，是它把OPC和制造业、跨境电商、B端场景绑在了一起。对一人公司来说，这比单纯送钱更重要。',
        content: s21,
        url: s21Url,
        source: '知乎专栏',
        category: 'CASE',
        isOriginal: true,
        author: 'OPC创业圈编辑部',
        publishedAt: new Date()
      }
    });
    console.log('✅ Guangzhou inserted:', r2.id);

    const r3 = await prisma.news.create({
      data: {
        title: '厦门OPC深度攻略：0租金会员制+一天开业，这座城市把一人公司当真了',
        summary: '哪个城市最懂“独立创业者不想折腾”的心理？厦门一定在前列。把注册、办公、场景、社区氛围都尽量简化。0租金、一天开业、软件园场景。',
        content: s22,
        url: s22Url,
        source: '知乎专栏',
        category: 'CASE',
        isOriginal: true,
        author: 'OPC创业圈编辑部',
        publishedAt: new Date()
      }
    });
    console.log('✅ Xiamen inserted:', r3.id);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

publish();
