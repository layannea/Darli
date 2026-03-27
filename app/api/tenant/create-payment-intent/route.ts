import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string

  const { unitId, amount, month } = await req.json()
  if (!unitId || !amount || !month)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Verify tenant has accepted invite for this unit
  const tenantUnit = await prisma.tenantUnit.findFirst({
    where: { unitId, tenantId: userId, status: 'accepted' },
    include: { unit: { include: { building: { include: { landlord: true } } } } },
  })
  if (!tenantUnit)
    return NextResponse.json({ error: 'No accepted tenancy found for this unit' }, { status: 403 })

  // Prevent double payment
  const existing = await prisma.rentPayment.findFirst({
    where: { unitId, tenantId: userId, month },
  })
  if (existing)
    return NextResponse.json({ error: 'Rent already paid for this month' }, { status: 409 })

  const user = await prisma.user.findUnique({ where: { id: userId } })

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      unitId,
      tenantId: userId,
      month,
      tenantEmail: user?.email || '',
      landlordId: tenantUnit.unit.building.landlordId,
    },
    description: `Rent payment — Unit ${tenantUnit.unit.unitNumber}, ${tenantUnit.unit.building.address} — ${month}`,
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}