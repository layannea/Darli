import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { address, city, state, zip, unitNumber, landlordEmail, landlordPhone } = await req.json()
  if (!address || !unitNumber)
    return NextResponse.json({ error: 'Address and unit number are required' }, { status: 400 })
  if (!landlordEmail && !landlordPhone)
    return NextResponse.json({ error: 'At least one landlord contact is required' }, { status: 400 })
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile || profile.role !== 'tenant')
    return NextResponse.json({ error: 'Not a tenant account' }, { status: 403 })
  await prisma.tenantRequest.create({
    data: {
      tenantId: userId,
      address,
      city: city ?? '',
      state: state ?? '',
      zip: zip ?? '',
      unitNumber,
      landlordEmail: landlordEmail ?? null,
      landlordPhone: landlordPhone ?? null,
      status: 'pending',
    },
  })
  await prisma.profile.update({ where: { userId }, data: { status: 'verified' } })
  return NextResponse.json({ success: true })
}