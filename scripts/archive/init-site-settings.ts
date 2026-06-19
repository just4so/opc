import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.siteSetting.upsert({
    where: { key: 'community_qrcode_url' },
    update: {},
    create: { key: 'community_qrcode_url', value: '' }
  })
  console.log('SiteSetting community_qrcode_url:', result)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
