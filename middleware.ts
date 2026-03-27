import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_ROUTES = ['/auth']
const PROTECTED_ROUTES = ['/dashboard', '/profile']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('darli_token')?.value

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))

  if (token) {
    const session = await verifyToken(token)
    if (!session && isProtected) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  } else if (isProtected) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}