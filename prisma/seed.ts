import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 기본 관리자 계정 생성
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@drone-rental.com' },
    update: {},
    create: {
      email: 'admin@drone-rental.com',
      name: '시스템 관리자',
      password: hashedPassword,
      role: 'ADMIN',
      approved: true,
    },
  })

  console.log('기본 관리자 계정이 생성되었습니다:', admin)

  // 샘플 드론 장비 데이터 생성
  const equipment1 = await prisma.equipment.upsert({
    where: { serialNumber: 'DJI-001' },
    update: {},
    create: {
      name: 'DJI Mavic Air 2',
      model: 'Mavic Air 2',
      serialNumber: 'DJI-001',
      description: '4K 카메라가 장착된 전문가용 드론입니다. 34분 비행시간을 지원합니다.',
      status: 'AVAILABLE',
    },
  })

  const equipment2 = await prisma.equipment.upsert({
    where: { serialNumber: 'DJI-002' },
    update: {},
    create: {
      name: 'DJI Mini 3 Pro',
      model: 'Mini 3 Pro',
      serialNumber: 'DJI-002',
      description: '컴팩트한 크기의 고성능 드론. 4K/60fps 촬영이 가능합니다.',
      status: 'AVAILABLE',
    },
  })

  const equipment3 = await prisma.equipment.upsert({
    where: { serialNumber: 'DJI-003' },
    update: {},
    create: {
      name: 'DJI Phantom 4 Pro',
      model: 'Phantom 4 Pro',
      serialNumber: 'DJI-003',
      description: '전문가용 드론으로 장애물 감지 기능과 고화질 카메라를 제공합니다.',
      status: 'AVAILABLE',
    },
  })

  const equipment4 = await prisma.equipment.upsert({
    where: { serialNumber: 'DJI-004' },
    update: {},
    create: {
      name: 'DJI Air 2S',
      model: 'Air 2S',
      serialNumber: 'DJI-004',
      description: '1인치 CMOS 센서가 장착된 고급형 드론입니다.',
      status: 'UNAVAILABLE',
    },
  })

  const equipment5 = await prisma.equipment.upsert({
    where: { serialNumber: 'DJI-005' },
    update: {},
    create: {
      name: 'DJI FPV',
      model: 'FPV',
      serialNumber: 'DJI-005',
      description: 'FPV 비행 경험을 제공하는 고속 드론입니다.',
      status: 'AVAILABLE',
    },
  })

  console.log('샘플 장비 데이터가 생성되었습니다')
  console.log({ equipment1, equipment2, equipment3, equipment4, equipment5 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })