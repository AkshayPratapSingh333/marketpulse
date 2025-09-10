import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth/') // Added trailing slash to be more specific
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    const isProtectedPage = req.nextUrl.pathname.startsWith('/dashboard') || 
                           req.nextUrl.pathname.startsWith('/upload') ||
                           req.nextUrl.pathname.startsWith('/auth-dashboard')

    // If user is authenticated and tries to access auth pages (like signin/signup), redirect to dashboard
    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return null
    }

    // If user is not authenticated and tries to access protected pages, redirect to sign in
    if (!isAuth && isProtectedPage) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    // If user is authenticated but not admin trying to access admin pages
    if (isAdminPage && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Allow access if user is authenticated or accessing public pages
    return null
  },
  {
    callbacks: {
      authorized: ({ token }) => true,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/upload/:path*', 
    '/auth-dashboard/:path*',
    '/admin/:path*', 
    '/auth/:path*' // This will match /auth/signin, /auth/signup, etc. but not /auth-dashboard
  ]
}