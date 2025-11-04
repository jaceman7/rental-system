import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // 대여 상태 자동 업데이트 (백그라운드에서 비동기 실행)
    // await를 제거하여 페이지 로딩을 차단하지 않음
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/rentals/update-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(error => {
      console.error('대여 상태 자동 업데이트 실패:', error)
    })

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // 관리자 페이지는 ADMIN 권한 또는 SUPER 등급 필요
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN' || token?.level === 'SUPER'
        }

        // 대시보드는 로그인된 사용자만
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*']
}