import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// 임시 비밀번호 생성 함수
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(
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

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 임시 비밀번호 생성
    const tempPassword = generateTempPassword()
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // 비밀번호 업데이트 및 임시 비밀번호 저장
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordResetRequested: false,
        passwordResetRequestedAt: null,
        tempPassword: tempPassword,
        tempPasswordCreatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      userName: user.name,
      userEmail: user.email,
      message: '임시 비밀번호가 생성되었습니다. 사용자가 직접 확인할 수 있습니다.'
    })
  } catch (error) {
    console.error('Admin password reset error:', error)
    return NextResponse.json(
      { error: '비밀번호 재설정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
