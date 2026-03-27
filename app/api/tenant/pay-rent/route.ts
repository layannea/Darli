import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { unitId, amount, month, last4 } = await req.json()

  if (!unitId || !amount || !month)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  // Prevent double payment
  const existing = await prisma.rentPayment.findFirst({
    where: { unitId, tenantId: userId, month },
  })
  if (existing)
    return NextResponse.json({ error: 'Rent already paid for this month' }, { status: 409 })

  const payment = await prisma.rentPayment.create({
    data: {
      unitId,
      tenantId: userId,
      amount: Number(amount),
      month,
      status: 'paid',
      last4: last4 || null,
    },
  })

  return NextResponse.json({ success: true, payment })
}