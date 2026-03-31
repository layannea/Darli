import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { userId, code } = await req.json()
  if (!userId || !code)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const record = await prisma.verificationCode.findFirst({
    where: { userId, code: code.trim(), used: false, type: 'phone' },
    orderBy: { createdAt: 'desc' },
  })

  if (!record)
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

  if (new Date() > record.expiresAt)
    return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 })

  await prisma.verificationCode.update({ where: { id: record.id }, data: { used: true } })
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } })

  return NextResponse.json({ success: true })
}