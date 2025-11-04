import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 사용자 통계 (관리자 제외, 전체는 승인된 사용자만)
    const totalUsers = await prisma.user.count({
      where: { approved: true, role: { not: 'ADMIN' } }
    })
    const pendingUsers = await prisma.user.count({
      where: { approved: false, role: { not: 'ADMIN' } }
    })
    const approvedUsers = await prisma.user.count({
      where: { approved: true, role: { not: 'ADMIN' } }
    })
    const adminUsers = await prisma.user.count({
      where: { role: 'ADMIN' }
    })
    const normalMembers = await prisma.user.count({
      where: { level: 'NORMAL', role: { not: 'ADMIN' }, approved: true }
    })
    const superMembers = await prisma.user.count({
      where: { level: 'SUPER', role: { not: 'ADMIN' }, approved: true }
    })

    // 장비 통계
    const totalEquipment = await prisma.equipment.count()
    const availableEquipment = await prisma.equipment.count({
      where: { status: 'AVAILABLE' }
    })
    const rentedEquipment = await prisma.equipment.count({
      where: { status: 'RENTED' }
    })
    const reservedEquipment = await prisma.equipment.count({
      where: { status: 'RESERVED' }
    })
    const unavailableEquipment = await prisma.equipment.count({
      where: { status: 'UNAVAILABLE' }
    })

    // 대여 통계
    const totalRentals = await prisma.rental.count()
    const pendingRentals = await prisma.rental.count({
      where: { status: 'PENDING' }
    })
    const approvedRentals = await prisma.rental.count({
      where: { status: 'APPROVED' }
    })
    const activeRentals = await prisma.rental.count({
      where: { status: 'ACTIVE' }
    })
    const completedRentals = await prisma.rental.count({
      where: { status: 'COMPLETED' }
    })
    const rejectedRentals = await prisma.rental.count({
      where: { status: 'REJECTED' }
    })

    return NextResponse.json({
      totalUsers,
      pendingUsers,
      approvedUsers,
      adminUsers,
      normalMembers,
      superMembers,
      totalEquipment,
      availableEquipment,
      rentedEquipment,
      reservedEquipment,
      unavailableEquipment,
      totalRentals,
      pendingRentals,
      approvedRentals,
      activeRentals,
      completedRentals,
      rejectedRentals
    })
  } catch (error) {
    console.error('상세 통계 조회 실패:', error)
    return NextResponse.json(
      { error: '통계 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
