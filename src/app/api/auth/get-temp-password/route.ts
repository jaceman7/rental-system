import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 임시 비밀번호 확인 (사용자용)
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

    // 임시 비밀번호가 있는지 확인
    if (!user.tempPassword) {
      return NextResponse.json(
        { error: '발급된 임시 비밀번호가 없습니다. 관리자가 아직 처리하지 않았을 수 있습니다.' },
        { status: 404 }
      )
    }

    // 임시 비밀번호 유효기간 확인 (24시간)
    if (user.tempPasswordCreatedAt) {
      const createdTime = new Date(user.tempPasswordCreatedAt).getTime()
      const now = new Date().getTime()
      const hoursPassed = (now - createdTime) / (1000 * 60 * 60)

      if (hoursPassed > 24) {
        return NextResponse.json(
          { error: '임시 비밀번호가 만료되었습니다. (유효기간: 24시간)\n다시 비밀번호 재설정을 요청해주세요.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      tempPassword: user.tempPassword,
      createdAt: user.tempPasswordCreatedAt,
      message: '임시 비밀번호가 확인되었습니다.'
    })
  } catch (error) {
    console.error('Temp password get error:', error)
    return NextResponse.json(
      { error: '임시 비밀번호 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
