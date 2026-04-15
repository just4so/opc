#!/usr/bin/env node
/**
 * Phase 2: LLM 精炼社区 benefits 字段
 * 
 * 数据源（全量）：
 * - DB字段: name, city, district, description, policies, realTips, entryProcess,
 *           services, suitableFor, focusTracks, focus, contactNote, transit,
 *           totalArea, totalWorkstations, entryInfo
 * - 雷达素材库: 按城市 grep 匹配
 * 
 * 执行方式: node scripts/refine_benefits_phase2.js [--dry-run] [--city 广州] [--limit 5]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');

const prisma = new PrismaClient();
const RADAR_PATH = '/Users/wei/Documents/Obsidian Vault/OPC创业圈/03_素材库/雷达素材.md';
const LOG_PATH = '/Users/wei/Documents/opc/scripts/refine_benefits_phase2_log.json';

// 解析命令行参数
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CITY_FILTER = args.includes('--city') ? args[args.indexOf('--city') + 1] : null;
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;

// API 配置（使用环境变量或 .env 文件）
function loadEnv() {
  const envPath = '/Users/wei/Documents/aidoc/.env';
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
}

loadEnv();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CUSTOM_API_KEY = process.env.SHUBIAOBIAO_API_KEY || process.env.OPENAI_API_KEY;
const CUSTOM_API_BASE = 'api.shubiaobiao.cn';

// 从雷达素材库中提取指定城市的相关内容
function getRadarData(city, communityName) {
  if (!fs.existsSync(RADAR_PATH)) return '';
  const content = fs.readFileSync(RADAR_PATH, 'utf-8');
  const lines = content.split('\n');
  const results = [];
  let currentBlock = [];
  let inBlock = false;
  let blockRelevant = false;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // 保存上一个块
      if (inBlock && blockRelevant && currentBlock.length > 0) {
        results.push(currentBlock.join('\n'));
      }
      currentBlock = [line];
      inBlock = true;
      // 检查这个块是否与城市/社区名相关
      blockRelevant = line.includes(city) || 
                      (communityName && line.includes(communityName.substring(0, 4)));
    } else if (inBlock) {
      currentBlock.push(line);
      // 也检查内容行是否包含城市/社区名
      if (!blockRelevant && (line.includes(city) || 
          (communityName && communityName.length > 3 && line.includes(communityName.substring(0, 4))))) {
        blockRelevant = true;
      }
    }
  }
  // 最后一个块
  if (inBlock && blockRelevant && currentBlock.length > 0) {
    results.push(currentBlock.join('\n'));
  }

  return results.slice(0, 5).join('\n\n'); // 最多取5个相关段落
}

// 调用 LLM API
async function callLLM(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: CUSTOM_API_BASE,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CUSTOM_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.content && parsed.content[0]) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('Invalid response: ' + data.substring(0, 200)));
          }
        } catch (e) {
          reject(new Error('Parse error: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

// 构建 LLM prompt
function buildPrompt(community, radarData) {
  const fields = [
    community.description && `【社区介绍】\n${community.description}`,
    community.policies && `【原始政策数据】\n${JSON.stringify(community.policies, null, 2)}`,
    community.realTips?.length && `【真实贴士】\n${community.realTips.join('\n')}`,
    community.entryProcess?.length && `【入驻流程】\n${community.entryProcess.join('\n')}`,
    community.services?.length && `【服务内容】\n${community.services.join('\n')}`,
    community.suitableFor?.length && `【适合人群】\n${community.suitableFor.join('\n')}`,
    community.focusTracks?.length && `【方向赛道】\n${community.focusTracks.join('、')}`,
    community.focus?.length && `【业务方向】\n${community.focus.join('、')}`,
    community.contactNote && `【联系备注】\n${community.contactNote}`,
    community.transit && `【交通信息】\n${community.transit}`,
    community.totalArea && `【总面积】${community.totalArea}`,
    community.totalWorkstations && `【总工位数】${community.totalWorkstations}`,
    community.entryInfo && `【入驻信息】\n${JSON.stringify(community.entryInfo, null, 2)}`,
    radarData && `【雷达素材库相关数据】\n${radarData}`,
  ].filter(Boolean).join('\n\n');

  return `你是一个专业的OPC（一人公司）创业社区数据编辑。请根据以下社区资料，提炼出结构化的入驻福利信息。

社区名称：${community.name}
城市：${community.city}${community.district ? ' · ' + community.district : ''}

=== 原始资料 ===
${fields}

=== 输出要求 ===
请提炼出以下5个维度的福利（只填有明确依据的内容，没有的维度不要填或填null）：

1. office（办公空间）：工位费用、面积、工位数量、合同期限等
2. compute（算力资源）：算力补贴比例/金额、算力资源类型等
3. business（业务支持）：商务对接、客户资源、政府服务、合规支持等
4. funding（资金支持）：股权投资、补贴、贷款、基金等资金方面
5. housing（住房支持）：人才公寓、住房补贴、租房折扣等

每个维度输出格式（JSON）：
{
  "summary": "一句话核心福利（25字内，直接写结论，如：最长12个月工位全免）",
  "items": ["具体条目1", "具体条目2"]
}

请严格输出以下JSON格式，不要有任何解释文字：
{
  "office": {...} 或 null,
  "compute": {...} 或 null,
  "business": {...} 或 null,
  "funding": {...} 或 null,
  "housing": {...} 或 null
}`;
}

// 加载已完成的日志
function loadLog() {
  if (fs.existsSync(LOG_PATH)) {
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
  }
  return { completed: [], failed: [], skipped: [] };
}

// 保存日志
function saveLog(log) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

async function main() {
  console.log(`\n=== Phase 2 社区 benefits 精炼 ===`);
  console.log(`模式: ${DRY_RUN ? 'DRY RUN（不写库）' : '正式写库'}`);
  if (CITY_FILTER) console.log(`城市过滤: ${CITY_FILTER}`);
  if (LIMIT) console.log(`数量限制: ${LIMIT}`);

  // 获取需要精炼的社区
  const whereClause = CITY_FILTER ? { city: CITY_FILTER } : {};
  const all = await prisma.community.findMany({
    where: whereClause,
    select: {
      id: true, name: true, city: true, district: true,
      description: true, policies: true, realTips: true,
      entryProcess: true, services: true, suitableFor: true,
      focusTracks: true, focus: true, contactNote: true,
      transit: true, totalArea: true, totalWorkstations: true,
      entryInfo: true, benefits: true
    }
  });

  const toRefine = all.filter(c => {
    if (!c.benefits) return true;
    return Object.keys(c.benefits).length <= 1;
  });

  const finalList = LIMIT ? toRefine.slice(0, LIMIT) : toRefine;
  console.log(`\n待处理: ${finalList.length} 条（来自 ${[...new Set(finalList.map(c=>c.city))].join('、')}）`);

  const log = loadLog();
  const completedIds = new Set(log.completed.map(r => r.id));

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < finalList.length; i++) {
    const community = finalList[i];
    const prefix = `[${i+1}/${finalList.length}] ${community.city} · ${community.name.substring(0, 15)}`;

    // 跳过已完成
    if (completedIds.has(community.id)) {
      console.log(`${prefix} — ⏭️ 已完成，跳过`);
      skipCount++;
      continue;
    }

    console.log(`\n${prefix}`);

    try {
      // 获取雷达素材
      const radarData = getRadarData(community.city, community.name);
      if (radarData) {
        console.log(`  📡 找到雷达素材 ${radarData.length} 字`);
      }

      // 构建 prompt
      const prompt = buildPrompt(community, radarData);

      if (DRY_RUN) {
        console.log(`  🔍 [DRY RUN] prompt 长度: ${prompt.length} 字`);
        console.log(`  🔍 数据字段: ${Object.keys(community).filter(k => community[k] && k !== 'id' && k !== 'benefits').join(', ')}`);
        successCount++;
        continue;
      }

      // 调用 LLM
      console.log(`  🤖 调用 LLM...`);
      const response = await callLLM(prompt);

      // 解析 JSON
      let benefits;
      try {
        // 提取 JSON（可能有前后多余文字）
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        benefits = JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error(`JSON 解析失败: ${e.message}\n原始响应: ${response.substring(0, 300)}`);
      }

      // 过滤掉 null 值
      const cleanedBenefits = {};
      for (const [key, val] of Object.entries(benefits)) {
        if (val && val !== null) {
          cleanedBenefits[key] = val;
        }
      }

      const filledCount = Object.keys(cleanedBenefits).length;
      console.log(`  ✅ 提炼完成，填充字段: ${Object.keys(cleanedBenefits).join(', ')} (${filledCount}个)`);

      // 写入数据库
      await prisma.community.update({
        where: { id: community.id },
        data: { benefits: cleanedBenefits }
      });
      console.log(`  💾 已写入数据库`);

      // 记录日志
      log.completed.push({
        id: community.id,
        name: community.name,
        city: community.city,
        fields: Object.keys(cleanedBenefits),
        timestamp: new Date().toISOString()
      });
      saveLog(log);
      successCount++;

      // 避免 API 限速
      await new Promise(r => setTimeout(r, 1500));

    } catch (err) {
      console.log(`  ❌ 失败: ${err.message.substring(0, 100)}`);
      log.failed.push({
        id: community.id,
        name: community.name,
        city: community.city,
        error: err.message.substring(0, 200),
        timestamp: new Date().toISOString()
      });
      saveLog(log);
      failCount++;

      // 失败后等待再继续
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n=== 完成 ===`);
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`⏭️ 跳过: ${skipCount}`);
  console.log(`日志: ${LOG_PATH}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
