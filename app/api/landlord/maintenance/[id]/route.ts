import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { status, landlordNote } = await req.json()

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: params.id },
    include: { unit: { include: { building: true } } },
  })

  if (!request || request.unit.building.landlordId !== userId)
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })

  const updated = await prisma.maintenanceRequest.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(landlordNote !== undefined && { landlordNote }),
      ...(status === 'resolved' && { resolvedAt: new Date() }),
      ...(status !== 'resolved' && { resolvedAt: null }),
    },
  })

  return NextResponse.json({ success: true, request: updated })
}