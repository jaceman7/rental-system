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

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 슈퍼 멤버 또는 관리자만 승인 가능
    if (session.user.level !== 'SUPER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        equipment: true
      }
    })

    if (!rental) {
      return NextResponse.json(
        { error: '대여 신청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (rental.status !== 'PENDING') {
      return NextResponse.json(
        { error: '이미 처리된 대여 신청입니다.' },
        { status: 400 }
      )
    }

    // 장비 상태가 유지보수 중이면 승인 불가
    if (rental.equipment.status === 'MAINTENANCE') {
      return NextResponse.json(
        { error: '현재 유지보수 중인 장비입니다.' },
        { status: 400 }
      )
    }

    // 장비가 AVAILABLE이 아닌 경우, 날짜 충돌 확인
    if (rental.equipment.status !== 'AVAILABLE') {
      // 같은 장비에 대해 활성화된(RESERVED, ACTIVE) 예약 중 날짜가 겹치는 것이 있는지 확인
      const conflictingRentals = await prisma.rental.findMany({
        where: {
          equipmentId: rental.equipmentId,
          status: { in: ['RESERVED', 'ACTIVE'] },
          id: { not: rental.id },
          OR: [
            {
              // 기존 예약의 시작일이 신청한 대여 기간 내에 있는 경우
              AND: [
                { startDate: { lte: rental.endDate } },
                { startDate: { gte: rental.startDate } }
              ]
            },
            {
              // 기존 예약의 종료일이 신청한 대여 기간 내에 있는 경우
              AND: [
                { endDate: { gte: rental.startDate } },
                { endDate: { lte: rental.endDate } }
              ]
            },
            {
              // 기존 예약이 신청한 대여 기간을 완전히 포함하는 경우
              AND: [
                { startDate: { lte: rental.startDate } },
                { endDate: { gte: rental.endDate } }
              ]
            }
          ]
        }
      })

      if (conflictingRentals.length > 0) {
        return NextResponse.json(
          { error: '해당 기간에 이미 다른 예약이 있어 승인할 수 없습니다.' },
          { status: 400 }
        )
      }
    }

    // 대여 승인 및 장비 상태 결정
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(rental.startDate)
    startDate.setHours(0, 0, 0, 0)

    // 시작일에 따라 rental과 equipment 상태 결정
    let rentalStatus: 'RESERVED' | 'ACTIVE'
    let equipmentStatus: 'RESERVED' | 'RENTED' | 'AVAILABLE'

    if (startDate <= today) {
      // 시작일이 오늘이거나 이전: 즉시 대여 시작
      rentalStatus = 'ACTIVE'
      equipmentStatus = 'RENTED'
    } else {
      // 시작일이 미래: 예약 상태로 유지, 장비는 아직 사용 가능
      rentalStatus = 'RESERVED'
      equipmentStatus = 'AVAILABLE'
    }

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: rentalStatus,
        equipment: {
          update: {
            status: equipmentStatus
          }
        }
      },
      include: {
        equipment: true,
        user: true
      }
    })

    // 같은 장비에 대해 날짜가 겹치는 다른 PENDING 신청들을 자동으로 거절
    const conflictingRentals = await prisma.rental.findMany({
      where: {
        equipmentId: rental.equipmentId,
        status: 'PENDING',
        id: { not: id },
        OR: [
          {
            // 다른 신청의 시작일이 승인된 대여 기간 내에 있는 경우
            AND: [
              { startDate: { lte: rental.endDate } },
              { startDate: { gte: rental.startDate } }
            ]
          },
          {
            // 다른 신청의 종료일이 승인된 대여 기간 내에 있는 경우
            AND: [
              { endDate: { gte: rental.startDate } },
              { endDate: { lte: rental.endDate } }
            ]
          },
          {
            // 다른 신청이 승인된 대여 기간을 완전히 포함하는 경우
            AND: [
              { startDate: { lte: rental.startDate } },
              { endDate: { gte: rental.endDate } }
            ]
          }
        ]
      },
      include: {
        user: true
      }
    })

    // 충돌하는 신청들을 자동으로 거절 처리
    if (conflictingRentals.length > 0) {
      await prisma.rental.updateMany({
        where: {
          id: {
            in: conflictingRentals.map(r => r.id)
          }
        },
        data: {
          status: 'REJECTED',
          notes: `해당 장비가 이미 다른 사용자에 의해 ${new Date(rental.startDate).toLocaleDateString()} - ${new Date(rental.endDate).toLocaleDateString()} 기간에 승인되어 자동으로 거절되었습니다.`
        }
      })
    }

    return NextResponse.json(updatedRental)
  } catch (error) {
    console.error('Rental approve error:', error)
    return NextResponse.json(
      { error: '대여 승인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
