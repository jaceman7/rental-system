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

    // 모든 사용자가 ACTIVE, RESERVED, RETURN_PENDING 상태의 대여를 조회 가능 (공개 정보)
    const rentals = await prisma.rental.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'RESERVED', 'RETURN_PENDING']
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        equipment: {
          select: { id: true, name: true, model: true, serialNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(rentals)
  } catch (error) {
    console.error('All rentals fetch error:', error)
    return NextResponse.json(
      { error: '대여 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
