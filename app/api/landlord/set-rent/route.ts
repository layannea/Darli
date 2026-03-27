import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { unitId, rentAmount } = await req.json()

  if (!unitId || rentAmount == null || isNaN(Number(rentAmount)) || Number(rentAmount) <= 0)
    return NextResponse.json({ error: 'Valid unit and rent amount required' }, { status: 400 })

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { building: true },
  })
  if (!unit || unit.building.landlordId !== userId)
    return NextResponse.json({ error: 'Unit not found or unauthorized' }, { status: 403 })

  await prisma.unit.update({
    where: { id: unitId },
    data: { rentAmount: Number(rentAmount) },
  })

  return NextResponse.json({ success: true })
}