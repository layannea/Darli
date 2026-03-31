import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.email)
      return NextResponse.json({ error: 'User not found or no email' }, { status: 404 })

    if (user.emailVerified)
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })

    // Rate limit: max 3 codes per 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentCodes = await prisma.verificationCode.count({
      where: { userId, createdAt: { gte: tenMinsAgo } },
    })
    if (recentCodes >= 3)
      return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 })

    // Invalidate old codes
    await prisma.verificationCode.updateMany({
      where: { userId, used: false },
      data: { used: true },
    })

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

    await prisma.verificationCode.create({
      data: { userId, code, type: 'email', expiresAt },
    })

    await sendVerificationEmail(user.email, code, user.name)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send code error:', err)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}