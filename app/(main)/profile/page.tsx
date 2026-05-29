import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  })
  if (!user) redirect('/login')

  redirect(`/profile/${user.username}`)
}
