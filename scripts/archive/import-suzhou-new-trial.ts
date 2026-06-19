/**
 * 苏州社区录入 - 试跑脚本（新增流程验证）
 * 社区：吴中武珞科技产业园
 * 测试边界：applyLink 只有电话无姓名
 */

import { PrismaClient } from '@prisma/client';
import { pinyin } from 'pinyin-pro';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

// 新材料原始数据（第2条）
const newData = {
  name: '吴中武珞科技产业园',
  district: '吴中区',
  description: '吴中武珞OPC社区依托国家级科技企业孵化器（工信部首批认定）及武汉大学苏州研究院资源，聚焦电子信息、人工智能、机器人、软件等硬科技领域，为独立开发者、自由创业者及小微团队搭建数智化创业生态。为"一人公司"创业者打造低成本、高赋能的创新平台。社区提供灵活办公、配套产学研对接、政策申报、投融资等一站式全周期服务，助力个体实现从创意到商业化的快速落地，打造区域硬科技 OPC 创业首选高地。',
  tags: ['软件，机器人'],
  applyLink: '15952418487',  // 只有电话，无姓名
  image: 'https://user6815.cn.imgto.link/public/20260408/2026-04-08-09-38-09.avif',
};

// 解析 applyLink → contactName + contactPhone
function parseApplyLink(applyLink: string): { contactName: string | null; contactPhone: string | null } {
  if (!applyLink) return { contactName: null, contactPhone: null };

  const phoneMatch = applyLink.match(/1[3-9]\d{9}|0\d{2,3}[-–]\d{7,8}|\d{7,8}/);
  const phone = phoneMatch ? phoneMatch[0] : null;

  const name = applyLink
    .replace(phone || '', '')
    .replace(/[,，\s\-–]/g, '')
    .trim() || null;

  return {
    contactName: (name && name.length >= 2) ? name : null,
    contactPhone: phone,
  };
}

// 生成 slug
function generateSlug(name: string): string {
  const cleaned = name
    .replace(/OPC社区|OPC|社区|产业园|创新中心|科技园|孵化器|智慧园|创业园/g, '')
    .replace(/[·•（）()【】\s·（拟）]/g, '')
    .trim();
  const py = pinyin(cleaned, { toneType: 'none', separator: '-', type: 'string' });
  return ('su-zhou-' + py)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/-$/, '');
}

// 清理 tags（部分 tags 内含顿号分隔，需拆分）
function parseTags(tags: string[]): string[] {
  const result: string[] = [];
  for (const tag of tags) {
    tag.split(/[，,、；;]/).forEach(t => {
      const cleaned = t.trim();
      if (cleaned) result.push(cleaned);
    });
  }
  return [...new Set(result)];
}

// 清理社区名（去掉换行、「（拟）」）
function cleanName(name: string): string {
  return name.replace(/[\r\n]/g, ' ').replace(/（拟）/g, '').trim();
}

// 判断 status
function getStatus(name: string): string {
  return name.includes('（拟）') ? 'DRAFT' : 'ACTIVE';
}

async function main() {
  const name = cleanName(newData.name);
  const status = getStatus(newData.name);
  const slug = generateSlug(name);
  const { contactName, contactPhone } = parseApplyLink(newData.applyLink);
  const focusTracks = parseTags(newData.tags);

  console.log('=== 试跑：新增流程 ===');
  console.log('name:', name);
  console.log('slug:', slug);
  console.log('status:', status);
  console.log('contactName:', contactName, '(applyLink:', newData.applyLink, ')');
  console.log('contactPhone:', contactPhone);
  console.log('focusTracks:', JSON.stringify(focusTracks));
  console.log('description长度:', newData.description.length);
  console.log();

  // DB 存在性检查（三层）
  console.log('--- DB存在性检查 ---');
  const exact = await prisma.community.findFirst({ where: { name } });
  if (exact) {
    console.log('⚠️  精确匹配已存在:', exact.id, exact.slug, '→ 应走更新流程，终止新增');
    await prisma.$disconnect();
    return;
  }
  const bySlug = await prisma.community.findFirst({ where: { slug } });
  if (bySlug) {
    console.log('⚠️  slug冲突:', bySlug.name, '→ 需要调整slug');
    await prisma.$disconnect();
    return;
  }
  console.log('✅ DB中不存在，走新增流程');
  console.log();

  // 构建 create data
  const createData = {
    name,
    slug,
    city: '苏州',
    district: newData.district,
    description: newData.description,
    focusTracks,
    contactName,
    contactPhone,
    status,
    address: `苏州市${newData.district}`,  // 占位，后续补全
    coverImage: null,       // 后续补图脚本处理
    entryFriendly: 3,       // 默认值，信息不足
    type: 'MIXED' as const, // 默认类型
    featured: false,
  };

  console.log('=== 准备写入 ===');
  console.log(JSON.stringify(createData, null, 2));
  console.log();

  const DRY_RUN = process.argv.includes('--execute') ? false : true;

  if (DRY_RUN) {
    console.log('🔍 DRY RUN 模式（传 --execute 才真正写入）');
    console.log('✅ 新增试跑逻辑验证通过');
  } else {
    console.log('🚀 执行写入...');
    const created = await prisma.community.create({ data: createData });
    console.log('✅ 新增成功');
    console.log('  id:', created.id);
    console.log('  slug:', created.slug);
    console.log('  页面:', `https://opcquan.com/communities/${created.slug}`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ 错误:', e);
  process.exit(1);
});
