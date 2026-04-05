#!/usr/bin/env node
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://fedcae95235369e3e766c52c9b1f721d.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '2cc44fe02cdb0d39b813eb8803260f83',
    secretAccessKey: 'c8c5e4f3097e3829759861f028b9a6b113209f7810b0c044c7a4f89d5503fce4',
  },
});
const BUCKET = 'opcquan-media';
const CDN = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev';
const p = new PrismaClient();

// 已上传的8张直接用URL，剩余11张需要重新上传
const uploaded = {
  '上海': 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1775362084426-c90df3.png',
  '北京': 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1775362102016-52aeb4.png',
  '苏州': 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1775362106055-8a2e5b.png',
  '合肥': 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1775362116660-cc2e3b.png',
  '无锡': 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1775362131978-b0b668.png',
  '济南': 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1775362147391-ef1974.png',
  '杭州': 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1775362153323-2adcdc.png',
  '南通': 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev/communities/1775362158144-e31057.png',
};

const remaining = {
  '南宁': 'nanning', '温州': 'wenzhou', '厦门': 'xiamen',
  '宿迁': 'suqian', '扬州': 'yangzhou', '成都': 'chengdu',
  '南京': 'nanjing', '石家庄': 'shijiazhuang', '深圳': 'shenzhen', '东莞': 'dongguan',
};

async function upload(fpath) {
  const buf = fs.readFileSync(fpath);
  const ts = Date.now();
  const rand = crypto.randomBytes(3).toString('hex');
  const key = `communities/${ts}-${rand}.png`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buf,
    ContentType: 'image/png', CacheControl: 'public, max-age=31536000',
  }));
  return `${CDN}/${key}`;
}

async function main() {
  const allUrls = { ...uploaded };

  // 上传剩余11张
  console.log('📤 上传剩余图片...');
  for (const [city, fname] of Object.entries(remaining)) {
    const fpath = `/tmp/opc-imgs/${fname}.png`;
    if (!fs.existsSync(fpath)) { console.log(`⚠️  找不到: ${fpath}`); continue; }
    try {
      const url = await upload(fpath);
      allUrls[city] = url;
      console.log(`✅ ${city} → ${url}`);
    } catch(e) { console.error(`❌ ${city}:`, e.message); }
  }

  // 写库
  console.log('\n💾 写入数据库...');
  let total = 0;
  for (const [city, url] of Object.entries(allUrls)) {
    const r = await p.community.updateMany({
      where: { city, status: 'ACTIVE', images: { isEmpty: true } },
      data: { images: [url] },
    });
    if (r.count > 0) { console.log(`✅ ${city}: ${r.count}条`); total += r.count; }
  }

  const left = await p.community.count({ where: { status: 'ACTIVE', images: { isEmpty: true } } });
  console.log(`\n完成: 更新 ${total} 条，剩余缺图 ${left} 条`);
  await p.$disconnect();
}
main();
