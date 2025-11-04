import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const { status, notes } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: '상태가 필요합니다.' },
        { status: 400 }
      )
    }

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        equipment: true,
        user: {
          select: { name: true, email: true }
        }
      }
    })

    if (!rental) {
      return NextResponse.json(
        { error: '대여를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 대여가 승인되면 날짜를 체크하여 RESERVED 또는 ACTIVE로 설정
    let finalStatus = status
    if (status === 'APPROVED') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = new Date(rental.startDate)
      startDate.setHours(0, 0, 0, 0)

      // 시작 날짜가 미래이면 RESERVED, 오늘이거나 과거이면 ACTIVE
      finalStatus = startDate > today ? 'RESERVED' : 'ACTIVE'
    }

    // 대여 상태 업데이트
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: finalStatus,
        ...(notes && { notes }),
      },
      include: {
        equipment: true,
        user: {
          select: { name: true, email: true }
        }
      }
    })

    // 대여 상태에 따라 장비 상태 동기화
    if (finalStatus === 'RESERVED') {
      // 대여 예약 상태일 때 장비도 RESERVED로 변경
      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: 'RESERVED' }
      })
    } else if (finalStatus === 'ACTIVE') {
      // 대여 중일 때 장비를 RENTED로 변경
      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: 'RENTED' }
      })
    } else if (finalStatus === 'COMPLETED' || finalStatus === 'CANCELLED' || finalStatus === 'REJECTED') {
      // 대여가 완료되거나 취소/거부되면 장비 상태를 AVAILABLE로 변경
      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: 'AVAILABLE' }
      })
    }

    // 승인 처리 시 같은 장비에 대해 날짜가 겹치는 다른 PENDING 신청들을 자동으로 거절
    if (status === 'APPROVED') {
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
    }

    return NextResponse.json(updatedRental)
  } catch (error) {
    console.error('Rental update error:', error)
    return NextResponse.json(
      { error: '대여 상태 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}