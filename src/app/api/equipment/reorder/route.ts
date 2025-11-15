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

    const { equipmentIds } = await request.json()

    if (!Array.isArray(equipmentIds)) {
      return NextResponse.json(
        { error: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }

    // 각 장비의 displayOrder 업데이트
    await Promise.all(
      equipmentIds.map((id, index) =>
        prisma.equipment.update({
          where: { id },
          data: { displayOrder: index }
        })
      )
    )

    return NextResponse.json({ message: '순서가 저장되었습니다.' })
  } catch (error) {
    console.error('Equipment reorder error:', error)
    return NextResponse.json(
      { error: '순서 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
