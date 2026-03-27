import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { inviteId } = await req.json()

  if (!inviteId) return NextResponse.json({ error: 'Invite ID required' }, { status: 400 })

  const invite = await prisma.tenantUnit.findUnique({
    where: { id: inviteId },
    include: { unit: { include: { building: true } } },
  })

  if (!invite || invite.status !== 'invited')
    return NextResponse.json({ error: 'Invite not found or already processed' }, { status: 404 })

  // Verify this invite was meant for this user
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const emailMatch = user?.email && invite.inviteEmail === user.email.toLowerCase()
  const phoneMatch = user?.phone && invite.invitePhone === user.phone
  if (!emailMatch && !phoneMatch)
    return NextResponse.json({ error: 'This invite was not sent to your account' }, { status: 403 })

  await prisma.tenantUnit.update({
    where: { id: inviteId },
    data: {
      status: 'accepted',
      tenantId: userId,
      acceptedAt: new Date(),
    },
  })

  // Make sure profile is verified
  await prisma.profile.updateMany({
    where: { userId, role: 'tenant' },
    data: { status: 'verified' },
  })

  return NextResponse.json({ success: true })
}