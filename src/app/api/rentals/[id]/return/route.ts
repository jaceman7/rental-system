import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 대여 정보 조회
    const rental = await prisma.rental.findUnique({
      where: { id: params.id },
      include: { equipment: true }
    })

    if (!rental) {
      return NextResponse.json(
        { error: '대여 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 본인의 대여인지 확인
    if (rental.userId !== session.user.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // ACTIVE 상태인지 확인
    if (rental.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '대여 중인 드론만 반납 신청할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 대여 상태를 RETURN_PENDING으로 변경 (관리자 승인 대기)
    await prisma.rental.update({
      where: { id: params.id },
      data: { status: 'RETURN_PENDING' }
    })

    return NextResponse.json({ message: '반납 신청이 완료되었습니다. 관리자 승인을 기다려주세요.' })
  } catch (error) {
    console.error('Return rental error:', error)
    return NextResponse.json(
      { error: '반납 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
