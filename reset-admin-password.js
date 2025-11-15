const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    // 기본 관리자 계정의 비밀번호를 'admin123'으로 재설정
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const admin = await prisma.user.update({
      where: { email: 'admin@drone-rental.com' },
      data: {
        password: hashedPassword,
      },
    })

    console.log('관리자 비밀번호가 성공적으로 재설정되었습니다.')
    console.log('이메일:', admin.email)
    console.log('비밀번호: admin123')
  } catch (error) {
    console.error('비밀번호 재설정 중 오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
