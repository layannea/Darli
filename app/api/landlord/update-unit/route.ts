import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { unitId, unitNumber, bedrooms, bathrooms, sqft, rentAmount } = await req.json()

  if (!unitId) return NextResponse.json({ error: 'Unit ID required' }, { status: 400 })

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { building: true },
  })
  if (!unit || unit.building.landlordId !== userId)
    return NextResponse.json({ error: 'Unit not found or unauthorized' }, { status: 403 })

  await prisma.unit.update({
    where: { id: unitId },
    data: {
      unitNumber: unitNumber || unit.unitNumber,
      bedrooms: bedrooms !== undefined ? (bedrooms === '' ? null : Number(bedrooms)) : unit.bedrooms,
      bathrooms: bathrooms !== undefined ? (bathrooms === '' ? null : Number(bathrooms)) : unit.bathrooms,
      sqft: sqft !== undefined ? (sqft === '' ? null : Number(sqft)) : unit.sqft,
      rentAmount: rentAmount !== undefined ? (rentAmount === '' ? null : Number(rentAmount)) : unit.rentAmount,
    },
  })

  return NextResponse.json({ success: true })
}