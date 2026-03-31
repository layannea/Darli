import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, method } = await req.json()

    if (!password || password.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    if (method === 'email') {
      if (!email?.includes('@'))
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

      const exists = await prisma.user.findUnique({ where: { email } })
      if (exists)
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

      const hashed = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: { email, name: name || null, password: hashed, emailVerified: false },
      })

      // Send verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      await prisma.verificationCode.create({
        data: {
          userId: user.id,
          code,
          type: 'email',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      })
      try {
        await sendVerificationEmail(email, code, name)
        console.log(`\n✉️  Verification code for ${email}: ${code}\n`)
      } catch (e) {
        console.error('Email send failed — but code is:', code)
        console.log(`\n🔑 DEV FALLBACK — Verification code for ${email}: ${code}\n`)
        // Don't throw — still show verify screen even if email fails
      }

      // Return userId but NO cookie yet — must verify first
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        userId: user.id,
        email: user.email,
      })
    }

    if (method === 'phone') {
      if (!phone || phone.replace(/\D/g, '').length < 7)
        return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 })

      const exists = await prisma.user.findUnique({ where: { phone } })
      if (exists)
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 })

      const hashed = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: { phone, name: name || null, password: hashed, emailVerified: true }, // phone users skip email verify
      })

      const token = await createToken({ userId: user.id, phone: user.phone ?? undefined })
      const res = NextResponse.json({ success: true, requiresVerification: false })
      res.cookies.set('darli_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      return res
    }

    return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}