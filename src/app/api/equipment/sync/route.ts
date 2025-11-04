import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 누구나 호출 가능한 자동 동기화 API (로그인만 필요)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // 로그인한 사용자만 호출 가능
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 1. 모든 장비를 AVAILABLE로 초기화 (MAINTENANCE 제외)
    const allEquipment = await prisma.equipment.findMany()

    for (const eq of allEquipment) {
      if (eq.status !== 'MAINTENANCE') {
        await prisma.equipment.update({
          where: { id: eq.id },
          data: { status: 'AVAILABLE' }
        })
      }
    }

    // 2. ACTIVE/RETURN_PENDING 렌탈의 장비를 RENTED로 변경
    const activeRentals = await prisma.rental.findMany({
      where: { status: { in: ['ACTIVE', 'RETURN_PENDING'] } }
    })

    for (const rental of activeRentals) {
      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: 'RENTED' }
      })
    }

    // 3. RESERVED 렌탈의 장비를 RESERVED로 변경
    const reservedRentals = await prisma.rental.findMany({
      where: { status: 'RESERVED' }
    })

    for (const rental of reservedRentals) {
      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: 'RESERVED' }
      })
    }

    return NextResponse.json({
      success: true,
      message: '동기화 완료',
      activeRentals: activeRentals.length,
      reservedRentals: reservedRentals.length
    })
  } catch (error) {
    console.error('Equipment sync error:', error)
    return NextResponse.json(
      { error: '동기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
