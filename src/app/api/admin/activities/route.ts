import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 최근 사용자 승인 내역
    const recentApprovedUsers = await prisma.user.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        name: true,
        email: true,
        createdAt: true
      }
    })

    // 최근 대여 신청
    const recentRentals = await prisma.rental.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { name: true }
        },
        equipment: {
          select: { name: true }
        }
      }
    })

    const activities = [
      ...recentApprovedUsers.map(user => ({
        type: 'user_approved',
        description: `${user.name} (${user.email}) 계정 승인됨`,
        timestamp: user.createdAt
      })),
      ...recentRentals.map(rental => ({
        type: 'rental',
        description: `${rental.user.name}님이 ${rental.equipment.name} 대여 신청 (${rental.status})`,
        timestamp: rental.createdAt
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

    return NextResponse.json(activities)
  } catch (error) {
    console.error('최근 활동 조회 실패:', error)
    return NextResponse.json(
      { error: '활동 내역 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
