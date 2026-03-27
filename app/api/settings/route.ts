import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.userId as string },
    select: { id: true, name: true, email: true, phone: true, avatar: true, createdAt: true, googleId: true },
  })
  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { name, phone, currentPassword, newPassword } = await req.json()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updateData: { name?: string | null; phone?: string | null; password?: string } = {}

  if (name !== undefined) updateData.name = name.trim() || null

  if (phone !== undefined) {
    const cleaned = phone.trim()
    if (cleaned && cleaned.replace(/\D/g, '').length < 7)
      return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 })
    if (cleaned) {
      const existing = await prisma.user.findUnique({ where: { phone: cleaned } })
      if (existing && existing.id !== userId)
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 })
    }
    updateData.phone = cleaned || null
  }

  if (newPassword) {
    if (newPassword.length < 8)
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    if (user.password && currentPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    } else if (user.password && !currentPassword) {
      return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
    }
    updateData.password = await bcrypt.hash(newPassword, 12)
  }

  await prisma.user.update({ where: { id: userId }, data: updateData })
  return NextResponse.json({ success: true })
}