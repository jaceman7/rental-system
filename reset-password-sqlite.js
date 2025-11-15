const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const db = new Database('./prisma/dev.db');

  try {
    // 새 비밀번호 해시 생성
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 관리자 계정 업데이트
    const stmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
    const result = stmt.run(hashedPassword, 'admin@drone-rental.com');

    if (result.changes > 0) {
      console.log('✓ 관리자 비밀번호가 성공적으로 재설정되었습니다!');
      console.log('');
      console.log('로그인 정보:');
      console.log('  이메일: admin@drone-rental.com');
      console.log('  비밀번호: admin123');
    } else {
      console.log('✗ 관리자 계정을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    db.close();
  }
}

resetPassword();
