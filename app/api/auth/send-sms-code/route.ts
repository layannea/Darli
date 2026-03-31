import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationSMS } from '@/lib/sms'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.phone)
      return NextResponse.json({ error: 'User not found or no phone' }, { status: 404 })

    if (user.emailVerified)
      return NextResponse.json({ error: 'Already verified' }, { status: 400 })

    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentCodes = await prisma.verificationCode.count({
      where: { userId, createdAt: { gte: tenMinsAgo } },
    })
    if (recentCodes >= 3)
      return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 })

    await prisma.verificationCode.updateMany({
      where: { userId, used: false },
      data: { used: true },
    })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await prisma.verificationCode.create({
      data: { userId, code, type: 'phone', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    })

    try {
      await sendVerificationSMS(user.phone, code)
      console.log(`\n📱 SMS code for ${user.phone}: ${code}\n`)
    } catch (e) {
      console.error('SMS failed — code is:', code)
      console.log(`\n🔑 DEV FALLBACK — SMS code for ${user.phone}: ${code}\n`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}