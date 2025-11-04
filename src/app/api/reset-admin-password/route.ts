import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const admin = await prisma.user.update({
      where: { email: 'admin@drone-rental.com' },
      data: {
        password: hashedPassword,
        tempPassword: null,
        tempPasswordCreatedAt: null
      }
    })

    return NextResponse.json({
      success: true,
      message: '관리자 비밀번호가 admin123으로 재설정되었습니다.',
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        approved: admin.approved
      }
    })
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error)
    return NextResponse.json({
      success: false,
      error: '비밀번호 재설정 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
