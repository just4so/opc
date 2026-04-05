#!/usr/bin/env node
// 把 /tmp/opc-imgs/ 下的图片上传到 R2，再批量写入对应城市社区的 images 字段
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 直接从环境变量读，或手动设置
process.env.R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '2cc44fe02cdb0d39b813eb8803260f83';
process.env.R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || 'c8c5e4f3097e3829759861f028b9a6b113209f7810b0c044c7a4f89d5503fce4';
process.env.R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'opcquan-media';
process.env.R2_ENDPOINT = process.env.R2_ENDPOINT || 'https://fedcae95235369e3e766c52c9b1f721d.r2.cloudflarestorage.com';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME;
const CDN = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev';
const p = new PrismaClient();

// 城市名 → 图片文件名映射
const cityToFile = {
  '上海': 'shanghai',
  '北京': 'beijing',
  '苏州': 'suzhou',
  '合肥': 'hefei',
  '无锡': 'wuxi',
  '济南': 'jinan',
  '杭州': 'hangzhou',
  '南通': 'nantong',
  '南宁': 'nanning',
  '温州': 'wenzhou',
  '厦门': 'xiamen',
  '宿迁': 'suqian',
  '扬州': 'yangzhou',
  '成都': 'chengdu',
  '南京': 'nanjing',
  '石家庄': 'shijiazhuang',
  '深圳': 'shenzhen',
  '东莞': 'dongguan',
};

async function uploadImage(filePath, key) {
  const buf = fs.readFileSync(filePath);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buf,
    ContentType: 'image/png',
    CacheControl: 'public, max-age=31536000',
  }));
  return `${CDN}/${key}`;
}

async function main() {
  const imgDir = '/tmp/opc-imgs';
  const uploadedUrls = {};

  // 1. 上传所有图片
  console.log('📤 上传图片到 R2...');
  for (const [city, fname] of Object.entries(cityToFile)) {
    const fpath = path.join(imgDir, `${fname}.png`);
    if (!fs.existsSync(fpath)) {
      console.log(`⚠️  ${city} 图片不存在: ${fpath}`);
      continue;
    }
    const ts = Date.now();
    const rand = crypto.randomBytes(3).toString('hex');
    const key = `communities/${ts}-${rand}.png`;
    try {
      const url = await uploadImage(fpath, key);
      uploadedUrls[city] = url;
      console.log(`✅ ${city} → ${url}`);
    } catch (e) {
      console.error(`❌ ${city} 上传失败:`, e.message);
    }
  }

  // 2. 批量写入数据库
  console.log('\n💾 写入数据库...');
  let updated = 0;
  for (const [city, url] of Object.entries(uploadedUrls)) {
    const result = await p.community.updateMany({
      where: { city, status: 'ACTIVE', images: { isEmpty: true } },
      data: { images: [url] },
    });
    if (result.count > 0) {
      console.log(`✅ ${city}: 更新 ${result.count} 条`);
      updated += result.count;
    }
  }

  // 3. 统计剩余
  const remaining = await p.community.count({
    where: { status: 'ACTIVE', images: { isEmpty: true } }
  });
  console.log(`\n完成: 共更新 ${updated} 条，剩余缺图 ${remaining} 条`);
  await p.$disconnect();
}

main();
