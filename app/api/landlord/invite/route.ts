import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function generateToken() {
  return Math.random().toString(36).slice(2, 10).toUpperCase() +
    Math.random().toString(36).slice(2, 10).toUpperCase()
}

async function sendInviteEmail({
  to, landlordName, unitNumber, buildingAddress, inviteUrl, inviteName,
}: {
  to: string; landlordName: string; unitNumber: string
  buildingAddress: string; inviteUrl: string; inviteName?: string | null
}) {
  const greeting = inviteName ? `Hi ${inviteName},` : 'Hi,'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  await resend.emails.send({
    from: 'Darli <onboarding@resend.dev>',
    to: process.env.NODE_ENV === 'production' ? to : 'lae2146@columbia.edu',
    subject: `${landlordName} invited you to join Darli`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#09090d;font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#0f0f14;border:1px solid #1e1e27;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px;border-bottom:1px solid #1e1e27;">
                    <span style="font-size:18px;font-weight:700;color:#ededf5;letter-spacing:-0.02em;">
                      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#7c6ffa;margin-right:8px;"></span>
                      Darli
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ededf5;letter-spacing:-0.025em;">
                      You've been invited
                    </h1>
                    <p style="margin:0 0 24px;font-size:14px;color:#8585a4;line-height:1.65;">
                      ${greeting} <strong style="color:#ededf5;">${landlordName}</strong> has invited you to manage your tenancy for
                      <strong style="color:#ededf5;">Unit ${unitNumber}</strong> at ${buildingAddress} through Darli — the housing financial platform.
                    </p>

                    <!-- Unit info box -->
                    <div style="background:#141419;border:1px solid #1e1e27;border-radius:10px;padding:20px;margin-bottom:28px;">
                      <div style="font-size:11px;font-weight:600;color:#52526e;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Your unit</div>
                      <div style="font-size:16px;font-weight:700;color:#ededf5;margin-bottom:4px;">Unit ${unitNumber}</div>
                      <div style="font-size:13px;color:#8585a4;">${buildingAddress}</div>
                    </div>

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="border-radius:9px;background:#7c6ffa;">
                          <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">
                            Accept Invitation →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;font-size:13px;color:#52526e;line-height:1.6;">
                      Or copy this link into your browser:
                    </p>
                    <p style="margin:0;font-size:12px;color:#52526e;word-break:break-all;">
                      ${inviteUrl}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #1e1e27;">
                    <p style="margin:0;font-size:12px;color:#52526e;">
                      © ${new Date().getFullYear()} Darli · If you weren't expecting this invite, you can ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.userId as string
  const { unitId, inviteEmail, invitePhone, inviteName } = await req.json()

  if (!unitId) return NextResponse.json({ error: 'Unit is required' }, { status: 400 })
  if (!inviteEmail && !invitePhone)
    return NextResponse.json({ error: 'At least one tenant contact is required' }, { status: 400 })

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: { building: { include: { landlord: true } } },
  })
  if (!unit || unit.building.landlordId !== userId)
    return NextResponse.json({ error: 'Unit not found or unauthorized' }, { status: 403 })

  const token = generateToken()

  const invite = await prisma.tenantUnit.create({
    data: {
      unitId,
      inviteEmail: inviteEmail?.toLowerCase() ?? null,
      invitePhone: invitePhone ?? null,
      inviteName: inviteName ?? null,
      inviteToken: token,
      status: 'invited',
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`
  const landlordName = unit.building.landlord.name || unit.building.landlord.email || 'Your landlord'

  // Send email if email provided
  if (inviteEmail) {
    try {
      await sendInviteEmail({
        to: inviteEmail,
        landlordName,
        unitNumber: unit.unitNumber,
        buildingAddress: `${unit.building.address}, ${unit.building.city}, ${unit.building.state}`,
        inviteUrl,
        inviteName,
      })
      console.log(`\n✉️  Invite email sent to ${inviteEmail}\n🔗 Invite URL: ${inviteUrl}\n`)
    } catch (e) {
      console.error('Failed to send invite email:', e)
      console.log(`\n🔗 DEV — Invite URL for ${inviteEmail}: ${inviteUrl}\n`)
    }
  } else {
    // Phone only — log URL for dev
    console.log(`\n🔗 Invite URL (phone invite): ${inviteUrl}\n`)
  }

  return NextResponse.json({ success: true, invite, inviteUrl })
}