import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 사용자 통계 (관리자 제외, 승인된 사용자만)
    const totalUsers = await prisma.user.count({
      where: { approved: true, role: { not: 'ADMIN' } }
    })
    const pendingUsers = await prisma.user.count({
      where: { approved: false, role: { not: 'ADMIN' } }
    })

    // 장비 통계
    const totalEquipment = await prisma.equipment.count()
    const availableEquipment = await prisma.equipment.count({
      where: { status: 'AVAILABLE' }
    })

    // 대여 통계
    const pendingRentals = await prisma.rental.count({
      where: { status: 'PENDING' }
    })
    const activeRentals = await prisma.rental.count({
      where: { status: 'ACTIVE' }
    })
    const returnPendingRentals = await prisma.rental.count({
      where: { status: 'RETURN_PENDING' }
    })

    // 비밀번호 재설정 요청 건수
    const passwordResetRequests = await prisma.user.count({
      where: { passwordResetRequested: true }
    })

    return NextResponse.json({
      totalUsers,
      pendingUsers,
      totalEquipment,
      availableEquipment,
      pendingRentals,
      activeRentals,
      returnPendingRentals,
      passwordResetRequests,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: '통계 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}