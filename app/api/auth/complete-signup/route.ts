import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.emailVerified)
    return NextResponse.json({ error: 'Email not verified' }, { status: 403 })

  const token = await createToken({
    userId: user.id,
    email: user.email ?? undefined,
  })

  const res = NextResponse.json({ success: true })
  res.cookies.set('darli_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}