import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/db'
import SettingsClient from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  })
  if (!user) redirect('/login')

  return <SettingsClient username={user.username} userId={session.user.id} />
}
