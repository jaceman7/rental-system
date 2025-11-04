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

    // 모든 활성 대여(RESERVED, ACTIVE) 조회
    const activeRentals = await prisma.rental.findMany({
      where: {
        status: {
          in: ['RESERVED', 'ACTIVE']
        }
      },
      include: {
        equipment: true
      }
    })

    const updates = []

    for (const rental of activeRentals) {
      let correctStatus = 'AVAILABLE'

      if (rental.status === 'RESERVED') {
        correctStatus = 'RESERVED'
      } else if (rental.status === 'ACTIVE') {
        correctStatus = 'RENTED'
      }

      // 장비 상태가 일치하지 않으면 업데이트
      if (rental.equipment.status !== correctStatus) {
        await prisma.equipment.update({
          where: { id: rental.equipmentId },
          data: { status: correctStatus }
        })

        updates.push({
          equipmentName: rental.equipment.name,
          from: rental.equipment.status,
          to: correctStatus
        })
      }
    }

    // 활성 대여가 없는데 RENTED나 RESERVED 상태인 장비들을 AVAILABLE로 변경
    const allEquipment = await prisma.equipment.findMany({
      where: {
        status: {
          in: ['RENTED', 'RESERVED']
        }
      },
      include: {
        rentals: {
          where: {
            status: {
              in: ['RESERVED', 'ACTIVE']
            }
          }
        }
      }
    })

    for (const equipment of allEquipment) {
      if (equipment.rentals.length === 0) {
        await prisma.equipment.update({
          where: { id: equipment.id },
          data: { status: 'AVAILABLE' }
        })

        updates.push({
          equipmentName: equipment.name,
          from: equipment.status,
          to: 'AVAILABLE'
        })
      }
    }

    return NextResponse.json({
      message: '장비 상태가 동기화되었습니다.',
      updates
    })
  } catch (error) {
    console.error('Equipment sync error:', error)
    return NextResponse.json(
      { error: '장비 상태 동기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
