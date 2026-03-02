# 드론 대여 관리 시스템

드론 장비 대여를 위한 웹 기반 관리 시스템입니다. Next.js 15와 Prisma ORM을 사용하여 구축되었으며, Google Cloud Run에 배포되어 있습니다.

## 🚀 라이브 데모

- **프로덕션 URL**: [https://rental-system-138812459322.asia-northeast3.run.app](https://rental-system-138812459322.asia-northeast3.run.app)
- **관리자 계정**:
  - 이메일: `admin@drone-rental.com`
  - 비밀번호: `admin123`

## 📋 주요 기능

### 사용자 관리
- 회원가입 및 로그인 (NextAuth.js 사용)
- 역할 기반 접근 제어 (관리자/직원)
- 사용자 승인 시스템 (관리자 승인 후 로그인 가능)

### 장비 관리
- 드론/장비 목록 관리
- 장비 상태 추적 (이용가능/대여중/정비중)
- 드래그 앤 드롭으로 장비 순서 변경

### 대여 관리
- 장비 대여 신청 및 승인
- 대여 상태 워크플로우 (대기중 → 승인/거절 → 진행중 → 완료)
- 대여 이력 추적

## 🛠 기술 스택

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Render 호스팅)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Deployment**: Google Cloud Run
- **CI/CD**: Cloud Build

## 💻 로컬 개발 환경 설정

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- PostgreSQL 데이터베이스 (로컬 또는 클라우드)

### 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/your-username/drone-rental-system.git
cd drone-rental-system
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/drone_rental"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. 데이터베이스 설정
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 스키마 적용
npx prisma db push

# 초기 데이터 시딩
npm run db:seed
```

5. 개발 서버 실행
```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션에 접근할 수 있습니다.

## 🚀 Google Cloud 배포

### Cloud Build를 통한 자동 배포
GitHub에 푸시하면 Cloud Build가 자동으로 실행되어 배포됩니다.

### 수동 배포
```bash
# 배포 스크립트 실행
./deploy-gcp.sh
```

자세한 배포 가이드는 다음 문서를 참조하세요:
- [GCP-DEPLOYMENT.md](./GCP-DEPLOYMENT.md)
- [GCP-SETUP-CHECKLIST.md](./GCP-SETUP-CHECKLIST.md)
- [GITHUB-GCP-SETUP.md](./GITHUB-GCP-SETUP.md)

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── admin/             # 관리자 대시보드
│   ├── auth/              # 인증 페이지
│   └── dashboard/         # 사용자 대시보드
├── components/            # 재사용 가능한 컴포넌트
│   └── ui/               # UI 컴포넌트 라이브러리
├── lib/                  # 유틸리티 및 설정
│   ├── auth.ts           # NextAuth 설정
│   └── prisma.ts         # Prisma 클라이언트
├── types/                # TypeScript 타입 정의
└── middleware.ts         # 라우트 보호
```

## 🔧 유용한 명령어

```bash
# Prisma Studio 실행 (데이터베이스 GUI)
npx prisma studio

# 린트 검사
npm run lint

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트 관련 문의사항은 이슈를 생성하거나 다음 연락처로 문의해주세요:
- Email: admin@drone-rental.com