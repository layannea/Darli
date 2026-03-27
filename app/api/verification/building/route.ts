import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { buildingIds } = await req.json()

  if (!Array.isArray(buildingIds) || buildingIds.length === 0)
    return NextResponse.json({ error: 'No building IDs provided' }, { status: 400 })

  // Verify these buildings belong to this landlord
  await prisma.building.updateMany({
    where: { id: { in: buildingIds }, landlordId: userId },
    data: { verified: true },
  })

  return NextResponse.json({ success: true })
}