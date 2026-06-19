/**
 * fix-cover-image-keys.ts
 * 将 R2 中含中文文件名的 coverImage 复制到正确的 slug key，并更新数据库
 */
import { PrismaClient } from '@prisma/client';
import { S3Client, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const R2_BUCKET = 'opcquan-media';
const R2_PUBLIC_BASE = 'https://pub-413b408ff02649388d393e4ff152b22e.r2.dev';
const R2_ENDPOINT = `https://fedcae95235369e3e766c52c9b1f721d.r2.cloudflarestorage.com`;

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const prisma = new PrismaClient();

async function fileExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function copyR2Object(srcKey: string, dstKey: string): Promise<void> {
  await s3.send(new CopyObjectCommand({
    Bucket: R2_BUCKET,
    CopySource: `${R2_BUCKET}/${encodeURIComponent(srcKey)}`,
    Key: dstKey,
  }));
}

async function main() {
  const communities = await prisma.community.findMany({
    select: { id: true, name: true, slug: true, coverImage: true },
  });

  const badCover = communities.filter(
    (c: any) => c.coverImage && /[^\x00-\x7F]/.test(c.coverImage)
  );

  console.log(`共 ${badCover.length} 条需要修复\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of badCover as any[]) {
    const oldUrl: string = c.coverImage;
    // 从 URL 中提取原始 key（去掉 base 前缀）
    const oldKey = decodeURIComponent(oldUrl.replace(`${R2_PUBLIC_BASE}/`, ''));
    const newKey = `communities/${c.slug}.jpg`;
    const newUrl = `${R2_PUBLIC_BASE}/${newKey}`;

    if (oldKey === newKey) {
      console.log(`[SKIP] ${c.slug} - 已经是正确 key`);
      skipped++;
      continue;
    }

    try {
      // 检查目标是否已存在
      const dstExists = await fileExists(newKey);
      if (!dstExists) {
        // 检查源是否存在
        const srcExists = await fileExists(oldKey);
        if (!srcExists) {
          console.log(`[WARN] ${c.slug} - 源文件不存在: ${oldKey}`);
          failed++;
          continue;
        }
        await copyR2Object(oldKey, newKey);
        console.log(`[COPY] ${c.slug}`);
        console.log(`       ${oldKey}`);
        console.log(`    => ${newKey}`);
      } else {
        console.log(`[EXISTS] ${c.slug} - 目标已存在，跳过复制`);
      }

      // 更新数据库
      await prisma.community.update({
        where: { id: c.id },
        data: { coverImage: newUrl },
      });
      console.log(`[DB] ${c.slug} => ${newUrl}\n`);
      success++;
    } catch (err) {
      console.error(`[ERROR] ${c.slug}: ${err}`);
      failed++;
    }
  }

  console.log('\n=== 完成 ===');
  console.log(`成功: ${success}, 跳过: ${skipped}, 失败: ${failed}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
