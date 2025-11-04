import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.level !== 'SUPER')) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 대여 승인 대기 건수
    const pendingRentals = await prisma.rental.count({
      where: { status: 'PENDING' }
    })

    // 반납 완료 대기 건수
    const returnPendingRentals = await prisma.rental.count({
      where: { status: 'RETURN_PENDING' }
    })

    // 계정 승인 대기 건수 (관리자만)
    let pendingUsers = 0
    // 비밀번호 재설정 요청 건수 (관리자만)
    let passwordResetRequests = 0
    if (session.user.role === 'ADMIN') {
      pendingUsers = await prisma.user.count({
        where: { approved: false, role: { not: 'ADMIN' } }
      })
      passwordResetRequests = await prisma.user.count({
        where: { passwordResetRequested: true }
      })
    }

    // 총 알림 건수
    const totalNotifications = pendingRentals + returnPendingRentals + pendingUsers + passwordResetRequests

    return NextResponse.json({
      pendingRentals,
      returnPendingRentals,
      pendingUsers,
      passwordResetRequests,
      totalNotifications,
    })
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json(
      { error: '알림 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
