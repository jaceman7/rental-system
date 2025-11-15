import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// 긴급 관리자 비밀번호 재설정 엔드포인트
// 보안: 사용 후 즉시 이 파일을 삭제하세요!
export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const admin = await prisma.user.update({
      where: { email: 'admin@drone-rental.com' },
      data: { password: hashedPassword }
    })

    return NextResponse.json({
      success: true,
      message: '✓ 관리자 비밀번호가 성공적으로 재설정되었습니다!',
      email: admin.email,
      newPassword: 'admin123',
      warning: '⚠️ 보안을 위해 이 API 엔드포인트를 즉시 삭제하세요!'
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '비밀번호 재설정 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
