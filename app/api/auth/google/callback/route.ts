import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${BASE_URL}/auth?error=google_denied`)
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${BASE_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(tokens.error_description ?? 'Token exchange failed')

    // 2. Fetch Google profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    const profile = await profileRes.json()
    if (!profileRes.ok) throw new Error('Failed to fetch Google profile')

    const { id: googleId, email, name, picture } = profile

    // 3. Find or create user
    let user = await prisma.user.findUnique({ where: { googleId } })

    if (!user && email) {
      // Check if an account already exists with this email
      const existingByEmail = await prisma.user.findUnique({ where: { email } })
      if (existingByEmail) {
        // Link Google to existing email account
        user = await prisma.user.update({
          where: { email },
          data: { googleId, avatar: picture ?? null },
        })
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          email: email ?? null,
          name: name ?? null,
          avatar: picture ?? null,
        },
      })
    }

    // 4. Create session token and redirect
    const token = await createToken({
      userId: user.id,
      email: user.email ?? undefined,
    })

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })

    const res = NextResponse.redirect(
      `${BASE_URL}${existingProfile ? '/dashboard' : '/profile/create'}`
    )
    res.cookies.set('darli_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return res
  } catch (err) {
    console.error('Google OAuth error:', err)
    return NextResponse.redirect(`${BASE_URL}/auth?error=google_failed`)
  }
}