import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Simple middleware for admin routes - actual auth check will be done in page components
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
