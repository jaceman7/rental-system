import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 장비 상태 변경 시 대여 상태 동기화 함수
async function syncRentalStatus(equipmentId: string, equipmentStatus: string) {
  // 해당 장비의 활성 대여(RESERVED 또는 ACTIVE) 찾기
  const activeRentals = await prisma.rental.findMany({
    where: {
      equipmentId,
      status: {
        in: ['RESERVED', 'ACTIVE']
      }
    }
  })

  for (const rental of activeRentals) {
    let newRentalStatus = rental.status

    // 장비 상태에 따라 대여 상태 결정
    if (equipmentStatus === 'AVAILABLE') {
      // 장비가 사용 가능으로 변경되면 활성 대여를 취소
      newRentalStatus = 'CANCELLED'
    } else if (equipmentStatus === 'RESERVED') {
      // 장비가 예약 상태면 대여도 예약 상태로
      newRentalStatus = 'RESERVED'
    } else if (equipmentStatus === 'RENTED') {
      // 장비가 대여 중이면 대여도 활성 상태로
      newRentalStatus = 'ACTIVE'
    } else if (equipmentStatus === 'UNAVAILABLE') {
      // 장비가 사용 불가면 활성 대여를 취소
      newRentalStatus = 'CANCELLED'
    }

    // 상태가 변경된 경우에만 업데이트
    if (newRentalStatus !== rental.status) {
      await prisma.rental.update({
        where: { id: rental.id },
        data: {
          status: newRentalStatus,
          notes: `관리자가 장비 상태를 ${equipmentStatus}로 변경하여 자동 ${newRentalStatus === 'CANCELLED' ? '취소' : '변경'}됨`
        }
      })
    }
  }
}

export async function GET(
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

    const { id } = await params
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        rentals: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!equipment) {
      return NextResponse.json(
        { error: '장비를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Equipment fetch error:', error)
    return NextResponse.json(
      { error: '장비 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const { id } = await params
    const body = await request.json()
    const { name, model, serialNumber, description, status, imageUrl } = body

    // 슈퍼 멤버는 상태만 변경 가능, 관리자는 모든 필드 변경 가능
    if (session.user.role !== 'ADMIN' && session.user.level !== 'SUPER') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 슈퍼 멤버는 상태만 변경 가능
    if (session.user.role !== 'ADMIN' && session.user.level === 'SUPER') {
      if (status === undefined) {
        return NextResponse.json(
          { error: '슈퍼 멤버는 장비 상태만 변경할 수 있습니다.' },
          { status: 403 }
        )
      }

      const equipment = await prisma.equipment.update({
        where: { id },
        data: { status }
      })

      // 장비 상태 변경 시 대여 상태도 동기화
      await syncRentalStatus(id, status)

      return NextResponse.json(equipment)
    }

    // 현재 equipment 정보 조회
    const currentEquipment = await prisma.equipment.findUnique({
      where: { id }
    })

    if (!currentEquipment) {
      return NextResponse.json(
        { error: '장비를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 관리자는 모든 필드 변경 가능
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (model !== undefined) updateData.model = model
    // serialNumber가 기존과 다를 때만 업데이트
    if (serialNumber !== undefined && serialNumber !== currentEquipment.serialNumber) {
      updateData.serialNumber = serialNumber
    }
    if (description !== undefined) updateData.description = description || ''
    if (status !== undefined) updateData.status = status
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl

    const equipment = await prisma.equipment.update({
      where: { id },
      data: updateData
    })

    // 관리자가 장비 상태를 변경한 경우 대여 상태도 동기화
    if (status !== undefined) {
      await syncRentalStatus(id, status)
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Equipment update error:', error)
    return NextResponse.json(
      { error: '장비 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    await prisma.equipment.delete({
      where: { id }
    })

    return NextResponse.json({ message: '장비가 삭제되었습니다.' })
  } catch (error) {
    console.error('Equipment delete error:', error)
    return NextResponse.json(
      { error: '장비 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}