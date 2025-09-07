import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Redirect to sign-in if accessing protected routes without authentication
    if (!token && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    // Redirect to dashboard if accessing auth pages while authenticated
    if (token && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Role-based access control
    if (token) {
      const userRole = token.role as string

      // Admin-only routes
      if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // Instructor-only routes
      if (pathname.startsWith('/instructor') && !['INSTRUCTOR', 'ADMIN'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to public routes
        const publicRoutes = ['/', '/courses', '/about', '/contact', '/privacy', '/terms']
        if (publicRoutes.includes(pathname)) {
          return true
        }

        // Allow access to auth routes
        if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
          return true
        }

        // Require authentication for protected routes
        if (pathname.startsWith('/dashboard') || 
            pathname.startsWith('/profile') || 
            pathname.startsWith('/settings') ||
            pathname.startsWith('/my-courses') ||
            pathname.startsWith('/certificates') ||
            pathname.startsWith('/admin') ||
            pathname.startsWith('/instructor')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}