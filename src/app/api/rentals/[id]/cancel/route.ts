import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 대여 정보 조회
    const rental = await prisma.rental.findUnique({
      where: { id: params.id }
    })

    if (!rental) {
      return NextResponse.json(
        { error: '대여 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 본인의 대여인지 확인
    if (rental.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // RESERVED 상태인지 확인
    if (rental.status !== 'RESERVED') {
      return NextResponse.json(
        { error: '예약된 대여만 취소할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 대여 상태를 CANCELLED로 변경
    await prisma.rental.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' }
    })

    // 장비 상태 자동 동기화
    // 해당 장비에 다른 활성 대여(RESERVED, ACTIVE, RETURN_PENDING)가 있는지 확인
    const hasOtherActiveRentals = await prisma.rental.findFirst({
      where: {
        equipmentId: rental.equipmentId,
        status: {
          in: ['RESERVED', 'ACTIVE', 'RETURN_PENDING']
        },
        id: {
          not: params.id
        }
      }
    })

    // 다른 활성 대여가 없으면 장비를 AVAILABLE로 변경
    if (!hasOtherActiveRentals) {
      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: 'AVAILABLE' }
      })
    }

    return NextResponse.json({ message: '예약이 취소되었습니다.' })
  } catch (error) {
    console.error('Cancel rental error:', error)
    return NextResponse.json(
      { error: '예약 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
