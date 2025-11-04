import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    console.log('=== 장비 상태 동기화 시작 ===')

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

    // 2. ACTIVE 렌탈의 장비를 RENTED로 변경
    const activeRentals = await prisma.rental.findMany({
      where: { status: 'ACTIVE' },
      include: { equipment: true }
    })

    for (const rental of activeRentals) {
      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: 'RENTED' }
      })
      console.log(`${rental.equipment.name}: RENTED로 설정`)
    }

    // 3. RESERVED 렌탈의 장비를 RESERVED로 변경
    const reservedRentals = await prisma.rental.findMany({
      where: { status: 'RESERVED' },
      include: { equipment: true }
    })

    for (const rental of reservedRentals) {
      await prisma.equipment.update({
        where: { id: rental.equipmentId },
        data: { status: 'RESERVED' }
      })
      console.log(`${rental.equipment.name}: RESERVED로 설정`)
    }

    // 최종 상태 확인
    const finalEquipment = await prisma.equipment.findMany({
      orderBy: { name: 'asc' }
    })

    console.log('=== 동기화 완료 ===')

    return NextResponse.json({
      message: '장비 상태가 동기화되었습니다.',
      equipment: finalEquipment,
      activeRentals: activeRentals.length,
      reservedRentals: reservedRentals.length
    })
  } catch (error) {
    console.error('Equipment sync error:', error)
    return NextResponse.json(
      { error: '장비 상태 동기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
