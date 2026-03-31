import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const invite = await prisma.tenantUnit.findUnique({
    where: { inviteToken: params.token },
    include: {
      unit: {
        include: {
          building: {
            include: { landlord: { select: { name: true, email: true } } },
          },
        },
      },
    },
  })

  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  if (invite.status === 'accepted') return NextResponse.json({ error: 'This invite has already been accepted.' }, { status: 410 })

  return NextResponse.json({
    invite: {
      id: invite.id,
      unitNumber: invite.unit.unitNumber,
      buildingAddress: invite.unit.building.address,
      buildingCity: invite.unit.building.city,
      buildingState: invite.unit.building.state,
      landlordName: invite.unit.building.landlord.name || invite.unit.building.landlord.email,
      inviteName: invite.inviteName,
      bedrooms: invite.unit.bedrooms,
      bathrooms: invite.unit.bathrooms,
      sqft: invite.unit.sqft,
      status: invite.status,
    },
  })
}