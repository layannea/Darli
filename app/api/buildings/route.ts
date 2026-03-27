import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { buildings } = await req.json()
  if (!Array.isArray(buildings) || buildings.length === 0)
    return NextResponse.json({ error: 'No buildings provided' }, { status: 400 })
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile || profile.role !== 'landlord')
    return NextResponse.json({ error: 'Not a landlord account' }, { status: 403 })

  const created = []
  for (const b of buildings) {
    const building = await prisma.building.create({
      data: {
        landlordId: userId,
        name: b.name ?? null,
        address: b.address,
        city: b.city,
        state: b.state,
        zip: b.zip ?? '',
        verified: false,
        units: {
          create: b.units.map((u: { number: string; bedrooms?: number; bathrooms?: number; sqft?: number }) => ({
            unitNumber: u.number,
            bedrooms: u.bedrooms ?? null,
            bathrooms: u.bathrooms ?? null,
            sqft: u.sqft ?? null,
          })),
        },
      },
    })
    created.push(building)
  }

  return NextResponse.json({ success: true, buildingIds: created.map(b => b.id) })
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const buildings = await prisma.building.findMany({
    where: { landlordId: userId },
    include: {
      units: {
        include: {
          tenantUnits: {
            include: {
              tenant: { select: { id: true, name: true, email: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          payments: {
            where: { month: currentMonth },
            orderBy: { paidAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ buildings, currentMonth })
}