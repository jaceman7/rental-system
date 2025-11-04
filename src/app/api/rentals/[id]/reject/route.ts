import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    // 슈퍼 멤버 또는 관리자만 거부 가능
    if (session.user.level !== 'SUPER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { notes } = body

    const rental = await prisma.rental.findUnique({
      where: { id }
    })

    if (!rental) {
      return NextResponse.json(
        { error: '대여 신청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (rental.status !== 'PENDING') {
      return NextResponse.json(
        { error: '이미 처리된 대여 신청입니다.' },
        { status: 400 }
      )
    }

    // 대여 거부
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: {
        status: 'REJECTED',
        notes: notes || '거부됨'
      },
      include: {
        equipment: true,
        user: true
      }
    })

    return NextResponse.json(updatedRental)
  } catch (error) {
    console.error('Rental reject error:', error)
    return NextResponse.json(
      { error: '대여 거부 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
