import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProfileCreateClient from './ProfileCreateClient'

export default async function ProfileCreatePage() {
  const session = await getSession()
  if (!session?.userId) redirect('/auth')

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId as string },
    select: { id: true },
  })

  if (profile) redirect('/dashboard')

  return <ProfileCreateClient />
}