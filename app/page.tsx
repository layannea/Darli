import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const session = await getSession()
  if (!session?.userId) {
    redirect('/auth')
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId as string },
    select: { id: true },
  })

  redirect(profile ? '/dashboard' : '/auth')
}