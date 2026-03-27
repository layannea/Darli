import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // All payments by this tenant
  const payments = await prisma.rentPayment.findMany({
    where: { tenantId: userId },
    include: { unit: { include: { building: true } } },
    orderBy: { paidAt: 'desc' },
  })

  // Only show unit info if tenant has ACCEPTED an invite — never before
  const tenantUnit = await prisma.tenantUnit.findFirst({
    where: { tenantId: userId, status: 'accepted' },
    include: {
      unit: {
        include: {
          building: {
            include: { landlord: { select: { name: true, email: true } } },
          },
          payments: {
            where: { tenantId: userId, month: currentMonth },
          },
        },
      },
    },
  })

  if (!tenantUnit) {
    // No accepted invite yet — return nothing, tenant sees "No unit connected" state
    return NextResponse.json({ rentInfo: null, payments })
  }

  const u = tenantUnit.unit
  return NextResponse.json({
    rentInfo: {
      unitNumber: u.unitNumber,
      address: u.building.address,
      city: u.building.city,
      state: u.building.state,
      rentAmount: u.rentAmount,
      unitId: u.id,
      currentMonth,
      paidThisMonth: u.payments.length > 0,
      landlordName: u.building.landlord.name || u.building.landlord.email,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      sqft: u.sqft,
    },
    payments,
  })
}