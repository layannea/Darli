import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateToken() {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { unitId, inviteEmail, invitePhone, inviteName } = await req.json()

  if (!unitId) return NextResponse.json({ error: 'Unit is required' }, { status: 400 })
  if (!inviteEmail && !invitePhone)
    return NextResponse.json({ error: 'At least one tenant contact is required' }, { status: 400 })

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { building: true },
  })
  if (!unit || unit.building.landlordId !== userId)
    return NextResponse.json({ error: 'Unit not found or unauthorized' }, { status: 403 })

  
  const invite = await prisma.tenantUnit.create({
    data: {
      unitId,
      inviteEmail: inviteEmail?.toLowerCase() ?? null,
      invitePhone: invitePhone ?? null,
      inviteName: inviteName ?? null,
      inviteToken: generateToken(),
      status: 'invited',
    },
  })
  return NextResponse.json({ success: true, invite })
}