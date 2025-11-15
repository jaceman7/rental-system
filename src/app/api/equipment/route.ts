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

    const equipment = await prisma.equipment.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Equipment fetch error:', error)
    return NextResponse.json(
      { error: '장비 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { name, model, serialNumber, description, imageUrl } = await request.json()

    if (!name || !model || !serialNumber) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const existingEquipment = await prisma.equipment.findUnique({
      where: { serialNumber }
    })

    if (existingEquipment) {
      return NextResponse.json(
        { error: '이미 등록된 시리얼 번호입니다.' },
        { status: 400 }
      )
    }

    const equipment = await prisma.equipment.create({
      data: {
        name,
        model,
        serialNumber,
        description,
        imageUrl,
        status: 'AVAILABLE'
      }
    })

    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error('Equipment create error:', error)
    return NextResponse.json(
      { error: '장비 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}