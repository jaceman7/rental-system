import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '새 비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
