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

    // 관리자와 슈퍼 멤버는 모든 대여 조회, 일반 멤버는 본인 대여만 조회
    const where = (session.user.role === 'ADMIN' || session.user.level === 'SUPER')
      ? {}
      : { userId: session.user.id }

    const rentals = await prisma.rental.findMany({
      where,
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
    console.error('Rentals fetch error:', error)
    return NextResponse.json(
      { error: '대여 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { equipmentId, startDate, endDate, purpose } = await request.json()

    if (!equipmentId || !startDate || !endDate || !purpose) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 장비 존재 여부 확인
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    })

    if (!equipment) {
      return NextResponse.json(
        { error: '장비를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용 불가 상태인 경우에만 거부
    if (equipment.status === 'UNAVAILABLE') {
      return NextResponse.json(
        { error: '현재 사용할 수 없는 장비입니다.' },
        { status: 400 }
      )
    }

    // 해당 기간에 다른 대여가 있는지 확인 (RESERVED, ACTIVE 상태 포함)
    const conflictingRental = await prisma.rental.findFirst({
      where: {
        equipmentId,
        status: { in: ['RESERVED', 'ACTIVE'] },
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) }
          }
        ]
      }
    })

    if (conflictingRental) {
      return NextResponse.json(
        { error: '해당 기간에 이미 예약되었거나 대여 중인 장비입니다.' },
        { status: 400 }
      )
    }

    const rental = await prisma.rental.create({
      data: {
        userId: session.user.id,
        equipmentId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        purpose,
        status: 'PENDING'
      },
      include: {
        equipment: {
          select: { name: true, model: true }
        }
      }
    })

    return NextResponse.json(rental, { status: 201 })
  } catch (error) {
    console.error('Rental create error:', error)
    return NextResponse.json(
      { error: '대여 신청 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}