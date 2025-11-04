import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 해당 장비의 RESERVED 및 ACTIVE 상태인 대여 목록 조회
    const rentals = await prisma.rental.findMany({
      where: {
        equipmentId: id,
        status: { in: ['RESERVED', 'ACTIVE'] }
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { startDate: 'asc' }
    })

    return NextResponse.json(rentals)
  } catch (error) {
    console.error('Equipment rentals fetch error:', error)
    return NextResponse.json(
      { error: '예약 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
