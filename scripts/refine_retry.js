// 补跑失败的10条
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const https = require('https');
const prisma = new PrismaClient();

const RADAR_PATH = '/Users/wei/Documents/Obsidian Vault/OPC创业圈/03_素材库/雷达素材.md';
const LOG_PATH = '/Users/wei/Documents/opc/scripts/refine_benefits_phase2_log.json';

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
    const body = JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1500, messages:[{role:'user',content:prompt}] });
    const req = https.request({
      hostname:'api.shubiaobiao.cn', path:'/v1/messages', method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':process.env.SHUBIAOBIAO_API_KEY||process.env.OPENAI_API_KEY,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(body)}
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { const p = JSON.parse(data); resolve(p.content[0].text); } catch(e) { reject(new Error('Parse: '+data.substring(0,200))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(45000, () => { req.destroy(); reject(new Error('Timeout')); });
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
    c.contactNote && `【联系备注】\n${c.contactNote}`,
    c.transit && `【交通信息】\n${c.transit}`,
    c.totalArea && `【总面积】${c.totalArea}`,
    c.totalWorkstations && `【总工位数】${c.totalWorkstations}`,
    c.entryInfo && `【入驻信息】\n${JSON.stringify(c.entryInfo,null,2)}`,
    radarData && `【雷达素材库】\n${radarData}`,
  ].filter(Boolean).join('\n\n');
  return `你是OPC社区数据编辑。根据以下资料提炼结构化入驻福利。

社区：${c.name}（${c.city}${c.district?'·'+c.district:''}）

${fields}

请严格输出纯JSON，不要任何解释，不要markdown代码块：
{"office":{"summary":"一句话核心（25字内）","items":["条目1"]},"compute":null,"business":null,"funding":null,"housing":null}

对于没有依据的维度请填null，有依据的填{"summary":"...","items":["..."]}`;
}

async function main() {
  const log = JSON.parse(fs.readFileSync(LOG_PATH,'utf-8'));
  const failedIds = log.failed.map(r => r.id);
  
  const communities = await prisma.community.findMany({
    where: { id: { in: failedIds } },
    select: { id:true,name:true,city:true,district:true,description:true,policies:true,realTips:true,entryProcess:true,services:true,suitableFor:true,focusTracks:true,focus:true,contactNote:true,transit:true,totalArea:true,totalWorkstations:true,entryInfo:true }
  });
  
  console.log('补跑条数:', communities.length);
  let ok=0, fail=0;
  
  for (let i=0; i<communities.length; i++) {
    const c = communities[i];
    console.log(`\n[${i+1}/${communities.length}] ${c.city}·${c.name.substring(0,15)}`);
    try {
      const radarData = getRadarData(c.city, c.name);
      if (radarData) console.log(`  📡 雷达素材 ${radarData.length}字`);
      const response = await callLLM(buildPrompt(c, radarData));
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const benefits = JSON.parse(jsonMatch[0]);
      const cleaned = Object.fromEntries(Object.entries(benefits).filter(([,v])=>v));
      await prisma.community.update({ where:{id:c.id}, data:{benefits:cleaned} });
      
      // 更新日志
      log.failed = log.failed.filter(r => r.id !== c.id);
      log.completed.push({ id:c.id, name:c.name, city:c.city, fields:Object.keys(cleaned), timestamp:new Date().toISOString() });
      fs.writeFileSync(LOG_PATH, JSON.stringify(log,null,2));
      console.log(`  ✅ 字段: ${Object.keys(cleaned).join(', ')}`);
      ok++;
    } catch(err) {
      console.log(`  ❌ ${err.message.substring(0,80)}`);
      const fi = log.failed.findIndex(r => r.id === c.id);
      if (fi >= 0) log.failed[fi].error = err.message.substring(0,200);
      fs.writeFileSync(LOG_PATH, JSON.stringify(log,null,2));
      fail++;
    }
    await new Promise(r => setTimeout(r, 2500));
  }
  console.log(`\n补跑完成: ✅${ok} ❌${fail}`);
  await prisma.$disconnect();
}
main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
