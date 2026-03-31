import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string

  const requests = await prisma.maintenanceRequest.findMany({
    where: {
      unit: { building: { landlordId: userId } },
    },
    include: {
      tenant: { select: { name: true, email: true, phone: true } },
      unit: {
        select: {
          unitNumber: true,
          building: { select: { address: true, city: true, state: true, name: true } },
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return NextResponse.json({ requests })
}