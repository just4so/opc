import { Suspense } from 'react'
import prisma from '@/lib/db'
import { RegisterForm } from '@/components/auth/register-form'

export default async function RegisterPage() {
  const communityCount = await prisma.community.count({
    where: { status: 'ACTIVE' },
  })

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <RegisterForm communityCount={communityCount} />
    </Suspense>
  )
}
