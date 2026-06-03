import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let client: S3Client | null = null

function getR2Client() {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return client
}

export async function getPresignedUploadUrl(key: string, contentType: string, maxSizeBytes?: number) {
  const r2 = getR2Client()
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
    // ContentLength intentionally omitted: presigned URL should not lock in a specific size,
    // as the browser sends the actual file size which differs from the max allowed size.
  })
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 })
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`
  return { uploadUrl, publicUrl }
}

export async function uploadBuffer(key: string, body: Buffer, contentType: string) {
  const r2 = getR2Client()
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  return `${process.env.R2_PUBLIC_URL}/${key}`
}
