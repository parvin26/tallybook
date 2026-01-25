import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Exclude static files and Next.js internal paths - return immediately
  // This is a safety check, but the matcher should prevent middleware from running for these paths
  const isStaticPath =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/brand') ||
    pathname.startsWith('/manifest.json') ||
    /\.(png|jpg|jpeg|gif|svg|ico|css|js|map|woff|woff2|ttf|eot|json)$/i.test(pathname)

  // Allow static files to be served without any processing
  if (isStaticPath) {
    return NextResponse.next()
  }

  // For all other paths, continue with normal Next.js processing
  return NextResponse.next()
}

// Only run middleware on app routes - explicitly exclude static files
// The matcher uses negative lookahead to exclude:
// - _next/* (Next.js internal)
// - favicon.ico
// - icons/* (all paths starting with /icons)
// - brand/* (all paths starting with /brand)
// - manifest.json
// - Any path ending with a file extension
export const config = {
  matcher: [
    /*
     * This pattern matches all paths EXCEPT:
     * - _next/*
     * - favicon.ico
     * - icons/*
     * - brand/*
     * - manifest.json
     * - Any file with extension (.png, .jpg, .svg, etc.)
     */
    '/((?!_next|favicon\\.ico|icons|brand|manifest\\.json|.*\\.[a-z0-9]{2,4}$).*)',
  ],
}
