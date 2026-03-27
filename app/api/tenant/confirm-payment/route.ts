import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string

  const { paymentIntentId, unitId, amount, month } = await req.json()

  // Verify payment actually succeeded with Stripe
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (intent.status !== 'succeeded')
    return NextResponse.json({ error: 'Payment not confirmed by Stripe' }, { status: 400 })

  // Prevent duplicate DB record
  const existing = await prisma.rentPayment.findFirst({
    where: { unitId, tenantId: userId, month },
  })
  if (existing) return NextResponse.json({ success: true, payment: existing })

  const last4 = intent.payment_method
    ? (await stripe.paymentMethods.retrieve(intent.payment_method as string)).card?.last4 ?? null
    : null

  const payment = await prisma.rentPayment.create({
    data: {
      unitId,
      tenantId: userId,
      amount: Number(amount),
      month,
      status: 'paid',
      last4,
    },
  })

  return NextResponse.json({ success: true, payment })
}