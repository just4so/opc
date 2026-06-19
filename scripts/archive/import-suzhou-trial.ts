/**
 * 苏州社区录入 - 试跑脚本（第1条，更新流程验证）
 * 社区：苏州大数据开发者创新中心·OPC生态社区
 * 目标：验证字段映射、更新规则、skill硬规则是否执行正确
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

// 新材料原始数据（第1条）
const newData = {
  name: '苏州大数据开发者创新中心·OPC生态社区',
  district: '相城区',
  description: '苏州人工智能产业园三楼苏州大数据开发者创新中心·OPC生态社区，由相高新科招公司联合区数据局、苏州数据资产运营有限公司共建，紧扣苏州市"AI+数据要素"发展战略，对标市级OPC社区标准打造。平台聚焦数据安全、公共数据授权运营与数据产品开发，布局仿真数据中心、数智创新实验室、可信数据空间等功能载体，构建"数据汇聚—研发创新—场景落地—生态培育"全链条服务体系。三方协同发力，致力打造开放式数据高地，助力相城高新区建设数智经济新高地，支撑全市人工智能与数据要素产业融合发展。',
  tags: ['AI发展', '数据服务', '创新生态', '产业融合'],
  applyLink: '王昊 18951101113',
};

// 解析 applyLink → contactName + contactPhone
function parseApplyLink(applyLink: string): { contactName: string | null; contactPhone: string | null } {
  if (!applyLink) return { contactName: null, contactPhone: null };

  // 匹配手机号（11位）或座机
  const phoneMatch = applyLink.match(/1[3-9]\d{9}|0\d{2,3}[-–]\d{7,8}|\d{8}/);
  const phone = phoneMatch ? phoneMatch[0] : null;

  // 姓名：去掉电话和分隔符后剩余的非空字符
  const name = applyLink
    .replace(phone || '', '')
    .replace(/[,，\s\-–]/g, '')
    .trim() || null;

  return { contactName: name || null, contactPhone: phone };
}

async function main() {
  console.log('=== 试跑：苏州大数据开发者创新中心·OPC生态社区 ===\n');

  // 1. 查DB现有记录
  const existing = await prisma.community.findFirst({
    where: { name: { contains: '苏州大数据开发者创新中心' } },
  });

  if (!existing) {
    console.error('❌ DB中未找到该记录，请检查');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ 找到DB记录');
  console.log('  id:', existing.id);
  console.log('  slug:', existing.slug);
  console.log('  description长度(现有):', existing.description?.length ?? 0);
  console.log('  contactName(现有):', existing.contactName);
  console.log('  contactPhone(现有):', existing.contactPhone);
  console.log('  focusTracks(现有):', JSON.stringify(existing.focusTracks));
  console.log('  coverImage(现有):', existing.coverImage);
  console.log();

  // 2. 解析联系人
  const { contactName, contactPhone } = parseApplyLink(newData.applyLink);
  console.log('解析 applyLink:', newData.applyLink);
  console.log('  → contactName:', contactName);
  console.log('  → contactPhone:', contactPhone);
  console.log();

  // 3. 按 skill 更新规则构建 patch
  const patch: Record<string, any> = {};

  // description：原有 <200字 → 覆盖
  if (!existing.description || existing.description.length < 200) {
    patch.description = newData.description;
    console.log(`📝 description: 原有${existing.description?.length ?? 0}字 < 200，覆盖`);
  } else {
    console.log(`⏭️  description: 原有${existing.description.length}字 ≥ 200，不动`);
  }

  // focusTracks：合并去重
  const existingTracks = (existing.focusTracks as string[]) || [];
  const mergedTracks = [...new Set([...existingTracks, ...newData.tags])];
  if (JSON.stringify(mergedTracks) !== JSON.stringify(existingTracks)) {
    patch.focusTracks = mergedTracks;
    console.log('📝 focusTracks: 合并 →', JSON.stringify(mergedTracks));
  } else {
    console.log('⏭️  focusTracks: 无新增，不动');
  }

  // contactName：有值则覆盖（skill：运营者自报优先）
  if (contactName && contactName !== existing.contactName) {
    patch.contactName = contactName;
    console.log(`📝 contactName: ${existing.contactName} → ${contactName}`);
  } else {
    console.log(`⏭️  contactName: 已有且一致(${existing.contactName})，不动`);
  }

  // contactPhone：有值则覆盖
  if (contactPhone && contactPhone !== existing.contactPhone) {
    patch.contactPhone = contactPhone;
    console.log(`📝 contactPhone: ${existing.contactPhone} → ${contactPhone}`);
  } else {
    console.log(`⏭️  contactPhone: 已有且一致(${existing.contactPhone})，不动`);
  }

  // coverImage：绝对不动（skill 硬规则）
  console.log('⏭️  coverImage: 已有R2图片，硬规则不动');

  // slug：绝对不动
  console.log('⏭️  slug: 硬规则不动');

  // status/createdAt：绝对不动
  console.log('⏭️  status/createdAt: 硬规则不动');

  console.log();

  // 4. 确认 patch 内容
  if (Object.keys(patch).length === 0) {
    console.log('ℹ️  无需更新，所有字段已是最新');
    await prisma.$disconnect();
    return;
  }

  console.log('=== 准备写入 patch ===');
  console.log(JSON.stringify(patch, null, 2));
  console.log();

  // 5. DRY RUN 模式（默认）：打印不执行
  const DRY_RUN = process.argv.includes('--execute') ? false : true;

  if (DRY_RUN) {
    console.log('🔍 DRY RUN 模式（传 --execute 才真正写入）');
    console.log('✅ 试跑完成，逻辑验证通过');
  } else {
    console.log('🚀 执行写入...');
    const updated = await prisma.community.update({
      where: { id: existing.id },
      data: patch,
    });
    console.log('✅ 写入成功');
    console.log('  description长度(更新后):', updated.description?.length);
    console.log('  focusTracks(更新后):', JSON.stringify(updated.focusTracks));
    console.log('  contactName(更新后):', updated.contactName);
    console.log('  contactPhone(更新后):', updated.contactPhone);
    console.log('  coverImage(更新后，应与原来一致):', updated.coverImage);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ 错误:', e);
  process.exit(1);
});
