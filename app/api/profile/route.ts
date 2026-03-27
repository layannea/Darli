import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()

  if (!session?.userId) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true },
  })

  // stale session: cookie exists but DB user was deleted
  if (!user) {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  return NextResponse.json({ profile: user.profile })
}

export async function POST(req: NextRequest) {
  const session = await getSession()

  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.userId as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const { role } = await req.json()

  if (!['landlord', 'tenant'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const existing = await prisma.profile.findUnique({
    where: { userId },
  })

  if (existing) {
    return NextResponse.json({ error: 'Profile already exists' }, { status: 409 })
  }

  const profile = await prisma.profile.create({
    data: {
      userId,
      role,
      status: role === 'tenant' ? 'verified' : 'pending',
    },
  })

  return NextResponse.json({ profile })
}