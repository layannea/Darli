import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, method } = await req.json()

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (method === 'email') {
      if (!email?.includes('@')) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
      }
      const exists = await prisma.user.findUnique({ where: { email } })
      if (exists) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
      const hashed = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: { email, name: name || null, password: hashed },
      })
      const token = await createToken({ userId: user.id, email: user.email ?? undefined })
      return respond(token, { id: user.id, email: user.email, name: user.name })
    }

    if (method === 'phone') {
      if (!phone || phone.replace(/\D/g, '').length < 7) {
        return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 })
      }
      const exists = await prisma.user.findUnique({ where: { phone } })
      if (exists) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 })
      }
      const hashed = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: { phone, name: name || null, password: hashed },
      })
      const token = await createToken({ userId: user.id, phone: user.phone ?? undefined })
      return respond(token, { id: user.id, phone: user.phone, name: user.name })
    }

    return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

function respond(token: string, user: object) {
  const res = NextResponse.json({ success: true, user })
  res.cookies.set('darli_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}