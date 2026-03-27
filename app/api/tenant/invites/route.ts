import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ invites: [] })

  const conditions: object[] = []
  if (user.email) conditions.push({ inviteEmail: user.email.toLowerCase() })
  if (user.phone) conditions.push({ invitePhone: user.phone })

  if (conditions.length === 0) return NextResponse.json({ invites: [] })

  const invites = await prisma.tenantUnit.findMany({
    where: {
      status: 'invited',
      OR: conditions,
    },
    include: {
      unit: {
        include: {
          building: {
            include: {
              landlord: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ invites })
}