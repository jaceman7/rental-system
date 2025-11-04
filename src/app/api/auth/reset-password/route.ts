import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 비밀번호 재설정 요청 (관리자에게 알림용)
export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: '이메일과 이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사용자 찾기 및 정보 확인
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: '해당 이메일로 등록된 계정이 없습니다.' },
        { status: 404 }
      )
    }

    if (user.name !== name) {
      return NextResponse.json(
        { error: '이름이 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 재설정 요청 플래그 설정
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetRequested: true,
        passwordResetRequestedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: '비밀번호 재설정 요청이 접수되었습니다. 관리자가 확인 후 처리해드립니다.'
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: '비밀번호 재설정 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
