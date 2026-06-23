import prisma from '@/lib/db'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const communityCount = await prisma.community.count({
    where: { status: 'ACTIVE' },
  })

  return <LoginForm communityCount={communityCount} />
}
