const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    // 새 비밀번호 해시 생성
    const newPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // 관리자 계정 업데이트
    const admin = await prisma.user.update({
      where: { email: 'admin@drone-rental.com' },
      data: { password: hashedPassword }
    })

    console.log('✓ 관리자 비밀번호가 성공적으로 재설정되었습니다!')
    console.log('')
    console.log('로그인 정보:')
    console.log('  이메일:', admin.email)
    console.log('  비밀번호: admin123')
  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
