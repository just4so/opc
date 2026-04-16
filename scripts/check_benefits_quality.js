const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.community.findMany({
    select: { id:true, name:true, city:true, benefits:true }
  });
  
  // 那75条：有benefits且字段>=2
  const good = all.filter(c => c.benefits && Object.keys(c.benefits).length >= 2);
  console.log('有2+字段的总数:', good.length);
  
  // 质量检查
  let issues = [];
  let emptyItems = 0, shortSummary = 0, goodCount = 0;
  
  good.forEach(c => {
    const b = c.benefits;
    let hasIssue = false;
    Object.keys(b).forEach(k => {
      if (!b[k]) return;
      const summary = (b[k].summary || '').trim();
      const items = b[k].items || [];
      if (summary.length < 5) {
        issues.push({ city:c.city, name:c.name.substring(0,12), issue:'summary过短', field:k, val:summary });
        hasIssue = true; shortSummary++;
      }
      if (items.length === 0) {
        issues.push({ city:c.city, name:c.name.substring(0,12), issue:'items为空', field:k });
        hasIssue = true; emptyItems++;
      }
    });
    if (!hasIssue) goodCount++;
  });
  
  console.log('\n质量统计:');
  console.log('  完全正常:', goodCount, '条');
  console.log('  summary过短:', shortSummary, '个字段');
  console.log('  items为空:', emptyItems, '个字段');
  
  if (issues.length > 0) {
    console.log('\n问题详情（前20）:');
    issues.slice(0,20).forEach(i => console.log('  '+i.city, i.name, '|', i.field, '-', i.issue, i.val ? '"'+i.val+'"' : ''));
  }
  
  // 字段覆盖统计
  const stats = { office:0, compute:0, business:0, funding:0, housing:0 };
  good.forEach(c => {
    Object.keys(c.benefits).forEach(k => { if (stats[k] !== undefined) stats[k]++; });
  });
  console.log('\n字段覆盖('+good.length+'条里):');
  Object.entries(stats).forEach(([k,v]) => console.log('  '+k+': '+v+'条 ('+Math.round(v/good.length*100)+'%)'));
  
  // 抽样几条看内容
  console.log('\n抽样内容（北京/深圳各1条）:');
  const samples = good.filter(c => c.city === '北京' || c.city === '深圳').slice(0,2);
  samples.forEach(c => {
    console.log('\n' + c.city + ' · ' + c.name);
    Object.entries(c.benefits).forEach(([k,v]) => {
      if (v) console.log('  ['+k+']', v.summary);
    });
  });
  
  await prisma.$disconnect();
}
main().catch(async e => { console.error(e); await prisma.$disconnect(); });
