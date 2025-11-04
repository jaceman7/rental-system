import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 기본 관리자 계정 생성
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const admin = await prisma.user.upsert({
      where: { email: 'admin@drone-rental.com' },
      update: {},
      create: {
        email: 'admin@drone-rental.com',
        name: '시스템 관리자',
        password: hashedPassword,
        role: 'ADMIN',
        approved: true,
      },
    })

    // 샘플 드론 장비 데이터 생성
    const equipmentData = [
      {
        serialNumber: 'DJI-001',
        name: 'DJI Mavic Air 2',
        model: 'Mavic Air 2',
        description: '4K 카메라가 장착된 전문가용 드론입니다. 34분 비행시간을 지원합니다.',
        status: 'AVAILABLE' as const,
      },
      {
        serialNumber: 'DJI-002',
        name: 'DJI Mini 3 Pro',
        model: 'Mini 3 Pro',
        description: '컴팩트한 크기의 고성능 드론. 4K/60fps 촬영이 가능합니다.',
        status: 'AVAILABLE' as const,
      },
      {
        serialNumber: 'DJI-003',
        name: 'DJI Phantom 4 Pro',
        model: 'Phantom 4 Pro',
        description: '전문가용 드론으로 장애물 감지 기능과 고화질 카메라를 제공합니다.',
        status: 'AVAILABLE' as const,
      },
      {
        serialNumber: 'DJI-004',
        name: 'DJI Air 2S',
        model: 'Air 2S',
        description: '1인치 CMOS 센서가 장착된 고급형 드론입니다.',
        status: 'MAINTENANCE' as const,
      },
      {
        serialNumber: 'DJI-005',
        name: 'DJI FPV',
        model: 'FPV',
        description: 'FPV 비행 경험을 제공하는 고속 드론입니다.',
        status: 'AVAILABLE' as const,
      },
    ]

    const equipment = []
    for (const item of equipmentData) {
      const eq = await prisma.equipment.upsert({
        where: { serialNumber: item.serialNumber },
        update: {},
        create: item,
      })
      equipment.push(eq)
    }

    return NextResponse.json({
      message: '시드 데이터가 성공적으로 생성되었습니다.',
      admin: { id: admin.id, email: admin.email, name: admin.name },
      equipment: equipment.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: '시드 데이터 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}