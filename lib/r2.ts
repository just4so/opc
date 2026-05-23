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

export async function getPresignedUploadUrl(key: string, contentType: string) {
  const r2 = getR2Client()
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 })
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`
  return { uploadUrl, publicUrl }
}
