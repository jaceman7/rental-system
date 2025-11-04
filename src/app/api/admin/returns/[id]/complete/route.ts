import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.level !== 'SUPER')) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params

    // 대여 정보 조회
    const rental = await prisma.rental.findUnique({
      where: { id }
    })

    if (!rental) {
      return NextResponse.json(
        { error: '대여 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // RETURN_PENDING 상태인지 확인
    if (rental.status !== 'RETURN_PENDING') {
      return NextResponse.json(
        { error: '반납 대기 상태인 대여만 완료 처리할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 대여 상태를 COMPLETED로 변경
    await prisma.rental.update({
      where: { id },
      data: { status: 'COMPLETED' }
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
          not: id
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

    return NextResponse.json({ message: '반납이 완료되었습니다.' })
  } catch (error) {
    console.error('Complete return error:', error)
    return NextResponse.json(
      { error: '반납 완료 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
