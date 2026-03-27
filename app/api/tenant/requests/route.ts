import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const requests = await prisma.tenantRequest.findMany({
    where: { tenantId: session.userId as string },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ requests })
}