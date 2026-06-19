#!/usr/bin/env node
/**
 * Upload .next/static/ to Cloudflare R2 using @aws-sdk/client-s3.
 * Runs as post-build step to ensure R2 has all static assets.
 * 
 * Required env vars: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 * Optional: R2_BUCKET_NAME (default: opcquan-media)
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';

const BUCKET = process.env.R2_BUCKET_NAME || 'opcquan-media';
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const ENDPOINT = 'https://fedcae95235369e3e766c52c9b1f721d.r2.cloudflarestorage.com';

if (!ACCESS_KEY || !SECRET_KEY) {
  console.warn('⚠️  R2 credentials not set, skipping static upload to R2.');
  console.warn('   Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY to enable.');
  process.exit(0); // Don't fail the build
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

const CONTENT_TYPES = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain',
};

function getContentType(filepath) {
  return CONTENT_TYPES[extname(filepath).toLowerCase()] || 'application/octet-stream';
}

function* walkDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkDir(full);
    else yield full;
  }
}

async function main() {
  const staticDir = join(process.cwd(), '.next', 'static');
  try { statSync(staticDir); } catch {
    console.error('ERROR: .next/static not found. Build may have failed.');
    process.exit(1);
  }

  const files = [...walkDir(staticDir)];
  console.log(`📦 Uploading ${files.length} static files to R2...`);

  let uploaded = 0, errors = 0;

  // Upload in batches of 10 for concurrency
  for (let i = 0; i < files.length; i += 10) {
    const batch = files.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (filepath) => {
        const rel = relative(staticDir, filepath);
        const key = `_next/static/${rel}`;
        const body = readFileSync(filepath);
        
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: body,
          ContentType: getContentType(filepath),
          CacheControl: 'public, max-age=31536000, immutable',
        }));
        return key;
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled') uploaded++;
      else { errors++; console.error(`  ❌ ${r.reason.message}`); }
    }
  }

  console.log(`✅ R2 upload: ${uploaded}/${files.length} files (${errors} errors)`);
  if (errors > 0) {
    console.warn('⚠️  Some files failed to upload. Site may have missing assets.');
    // Don't fail the build for upload errors
  }
}

main().catch(e => {
  console.error('R2 upload script error:', e.message);
  // Don't fail the build
  process.exit(0);
});
