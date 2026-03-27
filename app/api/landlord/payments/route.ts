import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string

  const buildings = await prisma.building.findMany({
    where: { landlordId: userId },
    include: { units: { include: { payments: { include: { tenant: true }, orderBy: { paidAt: 'desc' } } } } },
  })

  const payments = buildings.flatMap(b =>
    b.units.flatMap(u =>
      u.payments.map(p => ({
        ...p,
        unitNumber: u.unitNumber,
        buildingAddress: b.address,
        tenantName: p.tenant.name || p.tenant.email || 'Tenant',
      }))
    )
  ).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())

  return NextResponse.json({ payments })
}