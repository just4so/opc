// 补跑 refine_existing 中失败的条目
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const https = require('https');
const prisma = new PrismaClient();

const RADAR_PATH = '/Users/wei/Documents/Obsidian Vault/OPC创业圈/03_素材库/雷达素材.md';
const LOG_PATH = '/Users/wei/Documents/opc/scripts/refine_existing_log.json';

function loadEnv() {
  const envPath = '/Users/wei/Documents/aidoc/.env';
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath,'utf-8').split('\n').forEach(line => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g,'');
    });
  }
}
loadEnv();

function getRadarData(city, communityName) {
  if (!fs.existsSync(RADAR_PATH)) return '';
  const content = fs.readFileSync(RADAR_PATH, 'utf-8');
  const lines = content.split('\n');
  const results = [];
  let currentBlock = [], inBlock = false, blockRelevant = false;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inBlock && blockRelevant && currentBlock.length > 0) results.push(currentBlock.join('\n'));
      currentBlock = [line]; inBlock = true;
      blockRelevant = line.includes(city) || (communityName && line.includes(communityName.substring(0,4)));
    } else if (inBlock) {
      currentBlock.push(line);
      if (!blockRelevant && (line.includes(city) || (communityName && communityName.length > 3 && line.includes(communityName.substring(0,4))))) blockRelevant = true;
    }
  }
  if (inBlock && blockRelevant) results.push(currentBlock.join('\n'));
  return results.slice(0,5).join('\n\n');
}

function callLLM(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:2000, messages:[{role:'user',content:prompt}] });
    const req = https.request({
      hostname:'api.shubiaobiao.cn', path:'/v1/messages', method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':process.env.SHUBIAOBIAO_API_KEY||process.env.OPENAI_API_KEY,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(body)}
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { const p = JSON.parse(data); resolve(p.content[0].text); } catch(e) { reject(new Error('Parse: '+data.substring(0,300))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body); req.end();
  });
}

function buildPrompt(c, radarData) {
  const fields = [
    c.description && `【社区介绍】\n${c.description}`,
    c.policies && `【原始政策数据】\n${JSON.stringify(c.policies,null,2)}`,
    c.realTips && c.realTips.length && `【真实贴士】\n${c.realTips.join('\n')}`,
    c.entryProcess && c.entryProcess.length && `【入驻流程】\n${c.entryProcess.join('\n')}`,
    c.services && c.services.length && `【服务内容】\n${c.services.join('\n')}`,
    c.suitableFor && c.suitableFor.length && `【适合人群】\n${c.suitableFor.join('\n')}`,
    c.focusTracks && c.focusTracks.length && `【方向赛道】\n${c.focusTracks.join('、')}`,
    c.focus && c.focus.length && `【业务方向】\n${c.focus.join('、')}`,
    c.transit && `【交通信息】\n${c.transit}`,
    c.totalArea && `【总面积】${c.totalArea}`,
    c.totalWorkstations && `【总工位数】${c.totalWorkstations}`,
    c.entryInfo && `【入驻信息】\n${JSON.stringify(c.entryInfo,null,2)}`,
    radarData && `【雷达素材库】\n${radarData}`,
  ].filter(Boolean).join('\n\n');

  return `你是OPC社区数据编辑。根据以下资料提炼结构化入驻福利。

社区：${c.name}（${c.city}${c.district?'·'+c.district:''}）

${fields}

规则：
1. 禁止在任何字段出现：电话号码、微信号、邮箱、联系人姓名
2. 字段对应关系：office=租金/工位，compute=算力/AI工具，business=资源对接/政府服务，funding=资金/补贴/投资，housing=住房
3. 没有明确依据的维度填null
4. summary必须有实质内容（10-30字），不能为空

严格输出纯JSON（不要markdown，不要注释，不要多余文字）：
{"office":{"summary":"...","items":["..."]},"compute":null,"business":null,"funding":null,"housing":null}`;
}

async function main() {
  const log = JSON.parse(fs.readFileSync(LOG_PATH,'utf-8'));
  console.log('当前失败条数:', log.failed.length);
  
  if (log.failed.length === 0) {
    console.log('没有失败记录，无需补跑');
    await prisma.$disconnect();
    return;
  }

  const failedIds = log.failed.map(r => r.id);
  const communities = await prisma.community.findMany({
    where: { id: { in: failedIds } },
    select: { id:true,name:true,city:true,district:true,description:true,policies:true,realTips:true,entryProcess:true,services:true,suitableFor:true,focusTracks:true,focus:true,transit:true,totalArea:true,totalWorkstations:true,entryInfo:true }
  });

  let ok=0, fail=0;
  for (let i=0; i<communities.length; i++) {
    const c = communities[i];
    console.log(`\n[${i+1}/${communities.length}] ${c.city}·${c.name.substring(0,15)}`);
    try {
      const radarData = getRadarData(c.city, c.name);
      if (radarData) console.log(`  📡 雷达素材 ${radarData.length}字`);
      const response = await callLLM(buildPrompt(c, radarData));
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');
      const benefits = JSON.parse(jsonMatch[0]);

      const CONTACT_PATTERN = /1[3-9]\d{9}|微信|wechat|@|邮箱|联系/i;
      const cleaned = {};
      for (const [k,v] of Object.entries(benefits)) {
        if (!v) continue;
        const summary = (v.summary||'').trim();
        if (summary.length < 5) continue;
        const hasContact = CONTACT_PATTERN.test(summary) || (v.items||[]).some(i => CONTACT_PATTERN.test(i));
        if (hasContact) { console.log(`  ⚠️ 过滤联系方式: ${k}`); continue; }
        cleaned[k] = { summary, items: (v.items||[]).filter(i => !CONTACT_PATTERN.test(i)) };
      }
      if (Object.keys(cleaned).length === 0) throw new Error('清理后无有效字段');

      await prisma.community.update({ where:{id:c.id}, data:{benefits:cleaned} });
      log.failed = log.failed.filter(r => r.id !== c.id);
      log.completed.push({ id:c.id, name:c.name, city:c.city, fields:Object.keys(cleaned), timestamp:new Date().toISOString() });
      fs.writeFileSync(LOG_PATH, JSON.stringify(log,null,2));
      console.log(`  ✅ 字段: ${Object.keys(cleaned).join(', ')}`);
      ok++;
    } catch(err) {
      console.log(`  ❌ ${err.message.substring(0,80)}`);
      const fi = log.failed.findIndex(r => r.id === c.id);
      if (fi >= 0) log.failed[fi].retryError = err.message.substring(0,200);
      fs.writeFileSync(LOG_PATH, JSON.stringify(log,null,2));
      fail++;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log(`\n补跑完成: ✅${ok} ❌${fail}`);
  console.log('剩余失败:', log.failed.length);
  await prisma.$disconnect();
}
main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
