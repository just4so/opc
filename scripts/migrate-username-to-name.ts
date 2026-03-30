import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ where: { name: null } })
  console.log(`Found ${users.length} users with name = null`)

  let updated = 0
  for (const user of users) {
    const conflict = await prisma.user.findFirst({
      where: { name: user.username, id: { not: user.id } },
    })
    const newName = conflict ? user.username + '_2' : user.username
    await prisma.user.update({ where: { id: user.id }, data: { name: newName } })
    console.log(`Updated user ${user.id}: username=${user.username} → name=${newName}`)
    updated++
  }

  console.log(`Done. Updated ${updated} users.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
