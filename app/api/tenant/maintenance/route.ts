import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string

  const requests = await prisma.maintenanceRequest.findMany({
    where: { tenantId: userId },
    include: {
      unit: { include: { building: { select: { address: true, city: true, state: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ requests })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { unitId, title, description, category, priority } = await req.json()

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  if (!unitId) return NextResponse.json({ error: 'Unit is required' }, { status: 400 })

  // Verify tenant has access to this unit
  const tenantUnit = await prisma.tenantUnit.findFirst({
    where: { tenantId: userId, unitId, status: 'accepted' },
  })
  if (!tenantUnit) return NextResponse.json({ error: 'Not authorized for this unit' }, { status: 403 })

  const request = await prisma.maintenanceRequest.create({
    data: {
      tenantId: userId,
      unitId,
      title: title.trim(),
      description: description.trim(),
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
    },
  })

  return NextResponse.json({ success: true, request })
}