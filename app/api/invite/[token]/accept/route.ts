import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string

  const invite = await prisma.tenantUnit.findUnique({
    where: { inviteToken: params.token },
    include: { unit: { include: { building: true } } },
  })

  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  if (invite.status === 'accepted') return NextResponse.json({ error: 'Already accepted' }, { status: 410 })

  const user = await prisma.user.findUnique({ where: { id: userId } })

  // Verify email matches if invite was sent to an email
  if (invite.inviteEmail && user?.email) {
    if (invite.inviteEmail.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({
        error: `This invite was sent to ${invite.inviteEmail}. Please sign in with that email.`,
      }, { status: 403 })
    }
  }

  // Accept invite + link to user
  await prisma.tenantUnit.update({
    where: { id: invite.id },
    data: { status: 'accepted', tenantId: userId, acceptedAt: new Date() },
  })

  // Make sure tenant profile is verified
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) {
    await prisma.profile.create({ data: { userId, role: 'tenant', status: 'verified' } })
  } else if (profile.status !== 'verified') {
    await prisma.profile.update({ where: { userId }, data: { status: 'verified' } })
  }

  return NextResponse.json({ success: true })
}