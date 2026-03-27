import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isLatePayment(payment: { month: string; paidAt: Date }): boolean {
  const [year, month] = payment.month.split('-').map(Number)

  if (!year || !month) return false

  // Adjust this rule if your app uses a different due date.
  // This assumes rent for YYYY-MM is due by the 5th of that month.
  const dueDate = new Date(year, month - 1, 5, 23, 59, 59, 999)

  return new Date(payment.paidAt) > dueDate
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const viewerId = session.userId as string
  const targetId = params.userId

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    include: {
      profile: true,
      buildings: {
        include: { units: true },
      },
      payments: {
        orderBy: { paidAt: 'desc' },
      },
    },
  })

  if (!target || !target.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    include: { profile: true },
  })

  const targetRole = target.profile.role
  const viewerRole = viewer?.profile?.role

  const base = {
    id: target.id,
    name: target.name,
    role: targetRole,
    memberSince: target.createdAt,
    avatar: target.avatar,
    verified: target.profile.status === 'verified',
  }

  // Landlord profile
  if (targetRole === 'landlord') {
    const totalUnits = target.buildings.reduce((sum, building) => {
      return sum + building.units.length
    }, 0)

    const totalBuildings = target.buildings.length

    return NextResponse.json({
      profile: {
        ...base,
        totalBuildings,
        totalUnits,
        contact:
          viewerRole === 'tenant'
            ? {
                email: target.email,
                phone: target.phone,
              }
            : null,
      },
    })
  }

  // Tenant profile
  if (targetRole === 'tenant') {
    const isOwnProfile = viewerId === targetId
    const isLandlord = viewerRole === 'landlord'

    let hasRelationship = isOwnProfile

    if (isLandlord && !isOwnProfile) {
      const rel = await prisma.tenantUnit.findFirst({
        where: {
          tenantId: targetId,
          status: 'accepted',
          unit: {
            building: {
              landlordId: viewerId,
            },
          },
        },
      })

      hasRelationship = !!rel
    }

    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 24)

    const recentPaymentRows = target.payments.filter(
      (p) => new Date(p.paidAt) >= cutoff
    )

    const lateCount = recentPaymentRows.filter((p) =>
      isLatePayment({
        month: p.month,
        paidAt: p.paidAt,
      })
    ).length

    const totalPayments = recentPaymentRows.length

    if (!hasRelationship && !isOwnProfile) {
      return NextResponse.json({
        profile: { ...base },
      })
    }

    const paymentsWithDetails =
      hasRelationship || isOwnProfile
        ? await prisma.rentPayment.findMany({
            where: {
              tenantId: targetId,
              paidAt: { gte: cutoff },
            },
            include: {
              unit: {
                include: {
                  building: true,
                },
              },
            },
            orderBy: { paidAt: 'desc' },
            take: 24,
          })
        : []

    return NextResponse.json({
      profile: {
        ...base,
        latePayments: lateCount,
        totalPayments,
        onTimeRate:
          totalPayments > 0
            ? Math.round(((totalPayments - lateCount) / totalPayments) * 100)
            : 100,
        recentPayments: paymentsWithDetails.map((p) => ({
          id: p.id,
          amount: p.amount,
          month: p.month,
          paidAt: p.paidAt,
          isLate: isLatePayment({
            month: p.month,
            paidAt: p.paidAt,
          }),
          unitNumber: p.unit.unitNumber,
          buildingAddress: p.unit.building.address,
        })),
        contact: isOwnProfile
          ? {
              email: target.email,
              phone: target.phone,
            }
          : null,
      },
    })
  }

  return NextResponse.json({ profile: base })
}