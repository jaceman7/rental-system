import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // 한국 시간 기준으로 오늘 날짜 계산 (UTC+9)
    const now = new Date()
    const koreaOffset = 9 * 60 // 9시간을 분으로 변환
    const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000)

    // 한국 시간 기준 오늘 00:00:00
    const todayKorea = new Date(koreaTime)
    todayKorea.setUTCHours(0, 0, 0, 0)

    // RESERVED 상태이면서 시작일이 오늘이거나 지난 대여 건 찾기
    const reservedRentals = await prisma.rental.findMany({
      where: {
        status: 'RESERVED',
        startDate: {
          lte: todayKorea
        }
      }
    })

    // ACTIVE 상태이면서 종료일이 지난 대여 건 찾기
    const activeRentals = await prisma.rental.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: todayKorea
        }
      }
    })

    let updatedCount = 0

    // RESERVED → ACTIVE 업데이트
    for (const rental of reservedRentals) {
      await prisma.rental.update({
        where: { id: rental.id },
        data: { status: 'ACTIVE' }
      })

      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: 'RENTED' }
      })

      updatedCount++
    }

    // ACTIVE → COMPLETED 업데이트
    for (const rental of activeRentals) {
      await prisma.rental.update({
        where: { id: rental.id },
        data: { status: 'COMPLETED' }
      })

      // 해당 장비의 다른 활성 대여 상태 확인
      const otherActiveRental = await prisma.rental.findFirst({
        where: {
          equipmentId: rental.equipmentId,
          status: {
            in: ['RESERVED', 'ACTIVE', 'RETURN_PENDING']
          },
          id: {
            not: rental.id
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      })

      // 장비 상태를 올바르게 설정
      let newEquipmentStatus = 'AVAILABLE'
      if (otherActiveRental) {
        if (otherActiveRental.status === 'ACTIVE' || otherActiveRental.status === 'RETURN_PENDING') {
          newEquipmentStatus = 'RENTED'
        } else if (otherActiveRental.status === 'RESERVED') {
          newEquipmentStatus = 'RESERVED'
        }
      }

      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: newEquipmentStatus }
      })

      updatedCount++
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount}건의 대여 상태가 업데이트되었습니다.`,
      updated: updatedCount
    })
  } catch (error) {
    console.error('대여 상태 업데이트 오류:', error)
    return NextResponse.json(
      { error: '대여 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
