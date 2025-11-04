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

    // RETURN_PENDING 상태인 대여 목록 조회
    const returnPendingRentals = await prisma.rental.findMany({
      where: {
        status: 'RETURN_PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        equipment: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(returnPendingRentals)
  } catch (error) {
    console.error('Return pending rentals fetch error:', error)
    return NextResponse.json(
      { error: '반납 대기 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
