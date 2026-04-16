// 对已有2+字段的社区重新精炼（提升质量）
// 用法: node refine_existing.js [--offset 0] [--limit 20]
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

// 解析命令行
const args = process.argv.slice(2);
const OFFSET = args.includes('--offset') ? parseInt(args[args.indexOf('--offset')+1]) : 0;
const LIMIT  = args.includes('--limit')  ? parseInt(args[args.indexOf('--limit')+1])  : 9999;

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
    c.transit && `【交通信息】\n${c.transit}`,
    c.totalArea && `【总面积】${c.totalArea}`,
    c.totalWorkstations && `【总工位数】${c.totalWorkstations}`,
    c.entryInfo && `【入驻信息】\n${JSON.stringify(c.entryInfo,null,2)}`,
    radarData && `【雷达素材库相关数据】\n${radarData}`,
  ].filter(Boolean).join('\n\n');

  return `你是OPC（一人公司）创业社区数据编辑，请根据以下资料重新提炼结构化入驻福利。

社区：${c.name}（${c.city}${c.district?'·'+c.district:''}）

=== 原始资料 ===
${fields}

=== 提炼规则（必须严格遵守）===

**5个维度定义：**
- office（办公空间）：工位价格/费用、面积大小、工位数量、免租期、租金优惠等——只放空间和租金相关内容
- compute（算力资源）：GPU算力补贴比例/金额、算力券、AI工具免费账号、模型调用补贴——只放算力和AI工具相关
- business（业务支持）：政府服务对接、客户资源介绍、产业链资源、合规支持、生态圈、场景对接——只放业务和资源对接相关
- funding（资金支持）：孵化基金、股权投资、政府补贴金额、贷款支持、奖励资金——只放真实资金相关，政策性补贴写清楚金额
- housing（住房支持）：人才公寓、住房补贴、租房折扣、安居政策——只放住房相关

**禁止事项：**
1. 禁止在任何字段中出现：电话号码、微信号、邮箱地址、联系人姓名
2. 禁止字段内容串位（如算力补贴不能放在office里，联系方式不能放在任何benefits字段里）
3. 没有明确依据的维度必须填null，不能猜测或编造
4. summary字段必须是有实质内容的一句话（10-30字），不能为空字符串

**输出格式：**
严格输出纯JSON，不要markdown代码块，不要任何解释文字：
{
  "office": {"summary": "...", "items": ["..."]} 或 null,
  "compute": {"summary": "...", "items": ["..."]} 或 null,
  "business": {"summary": "...", "items": ["..."]} 或 null,
  "funding": {"summary": "...", "items": ["..."]} 或 null,
  "housing": {"summary": "...", "items": ["..."]} 或 null
}`;
}

function loadLog() {
  if (fs.existsSync(LOG_PATH)) return JSON.parse(fs.readFileSync(LOG_PATH,'utf-8'));
  return { completed:[], failed:[] };
}

async function main() {
  console.log('\n=== 重新精炼已有2+字段的社区 ===');
  
  const all = await prisma.community.findMany({
    select: { id:true,name:true,city:true,district:true,description:true,policies:true,realTips:true,entryProcess:true,services:true,suitableFor:true,focusTracks:true,focus:true,transit:true,totalArea:true,totalWorkstations:true,entryInfo:true,benefits:true }
  });
  
  // 取已有2+字段的
  const allToRefine = all.filter(c => c.benefits && Object.keys(c.benefits).length >= 2);
  const toRefine = allToRefine.slice(OFFSET, OFFSET + LIMIT);
  console.log(`目标条数: ${toRefine.length}（总${allToRefine.length}条，offset=${OFFSET} limit=${LIMIT}）`);
  
  const log = loadLog();
  const doneIds = new Set(log.completed.map(r => r.id));
  
  let ok=0, fail=0, skip=0;
  
  for (let i=0; i<toRefine.length; i++) {
    const c = toRefine[i];
    const prefix = `[${i+1}/${toRefine.length}] ${c.city}·${c.name.substring(0,14)}`;
    
    if (doneIds.has(c.id)) {
      console.log(prefix + ' ⏭️ 已完成');
      skip++; continue;
    }
    
    console.log('\n' + prefix);
    try {
      const radarData = getRadarData(c.city, c.name);
      if (radarData) console.log(`  📡 雷达素材 ${radarData.length}字`);
      
      const response = await callLLM(buildPrompt(c, radarData));
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');
      const benefits = JSON.parse(jsonMatch[0]);
      
      // 清理：过滤null，检查联系方式，清理空summary
      const CONTACT_PATTERN = /1[3-9]\d{9}|微信|wechat|@|邮箱|联系/i;
      const cleaned = {};
      for (const [k, v] of Object.entries(benefits)) {
        if (!v) continue;
        const summary = (v.summary||'').trim();
        if (summary.length < 5) continue; // 跳过空summary
        
        // 检查联系方式
        const hasContact = CONTACT_PATTERN.test(summary) || 
          (v.items||[]).some(item => CONTACT_PATTERN.test(item));
        if (hasContact) {
          console.log(`  ⚠️ 过滤含联系方式的字段: ${k}`);
          continue;
        }
        
        cleaned[k] = { summary, items: (v.items||[]).filter(item => !CONTACT_PATTERN.test(item)) };
      }
      
      if (Object.keys(cleaned).length === 0) {
        throw new Error('清理后无有效字段');
      }
      
      await prisma.community.update({ where:{id:c.id}, data:{benefits:cleaned} });
      
      log.completed.push({ id:c.id, name:c.name, city:c.city, fields:Object.keys(cleaned), timestamp:new Date().toISOString() });
      fs.writeFileSync(LOG_PATH, JSON.stringify(log,null,2));
      
      console.log(`  ✅ 字段: ${Object.keys(cleaned).join(', ')} (${Object.keys(cleaned).length}个)`);
      ok++;
    } catch(err) {
      console.log(`  ❌ ${err.message.substring(0,100)}`);
      log.failed.push({ id:c.id, name:c.name, city:c.city, error:err.message.substring(0,200), timestamp:new Date().toISOString() });
      fs.writeFileSync(LOG_PATH, JSON.stringify(log,null,2));
      fail++;
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  
  console.log(`\n=== 完成 ===`);
  console.log(`✅ 成功: ${ok}  ❌ 失败: ${fail}  ⏭️ 跳过: ${skip}`);
  await prisma.$disconnect();
}
main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
