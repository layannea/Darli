import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_CODE = 'DARLI-LL-2024'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { code } = await req.json()
  if (!code || code.trim().toUpperCase() !== VALID_CODE)
    return NextResponse.json(
      { error: 'Invalid verification code. Try DARLI-LL-2024.' },
      { status: 400 }
    )
  const userId = session.userId as string
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile || profile.role !== 'landlord')
    return NextResponse.json({ error: 'Not a landlord account' }, { status: 403 })
  await prisma.profile.update({ where: { userId }, data: { status: 'verified' } })
  return NextResponse.json({ success: true })
}