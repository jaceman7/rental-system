import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const rentals = await prisma.rental.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        equipment: {
          select: { id: true, name: true, model: true, serialNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // RESERVED 상태인 대여 중 시작 날짜가 오늘이거나 과거인 경우 자동으로 ACTIVE로 변경
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const rental of rentals) {
      if (rental.status === 'RESERVED') {
        const startDate = new Date(rental.startDate)
        startDate.setHours(0, 0, 0, 0)

        if (startDate <= today) {
          // 대여 상태를 ACTIVE로 변경
          await prisma.rental.update({
            where: { id: rental.id },
            data: { status: 'ACTIVE' }
          })
          rental.status = 'ACTIVE'

          // 장비 상태를 RENTED로 변경
          await prisma.equipment.update({
            where: { id: rental.equipment.id },
            data: { status: 'RENTED' }
          })
        }
      }
    }

    return NextResponse.json(rentals)
  } catch (error) {
    console.error('My rentals fetch error:', error)
    return NextResponse.json(
      { error: '내 대여 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}