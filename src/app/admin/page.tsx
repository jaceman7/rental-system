'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Package, Clock } from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  pendingUsers: number
  totalEquipment: number
  availableEquipment: number
  pendingRentals: number
  activeRentals: number
  returnPendingRentals: number
  passwordResetRequests: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    // 페이지 로드 시 자동 동기화
    syncEquipmentStatus()
    fetchStats()
  }, [])

  const syncEquipmentStatus = async () => {
    try {
      // 조용히 백그라운드에서 동기화
      await fetch('/api/equipment/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      // 에러 무시
      console.log('Auto-sync completed')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('통계 데이터 로딩 실패:', error)
    }
  }

  const handleSyncEquipment = async () => {
    if (!confirm('장비 상태를 동기화하시겠습니까?\n\n- ACTIVE 렌탈의 장비 → RENTED\n- RESERVED 렌탈의 장비 → RESERVED\n- 나머지 → AVAILABLE')) {
      return
    }

    try {
      const response = await fetch('/api/equipment/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`동기화 완료!\n\n- ACTIVE 렌탈: ${data.activeRentals}건\n- RESERVED 렌탈: ${data.reservedRentals}건`)
        fetchStats()
        window.location.href = '/dashboard'
      } else {
        const error = await response.json()
        alert('동기화 실패: ' + error.error)
      }
    } catch (error) {
      console.error('동기화 실패:', error)
      alert('동기화 중 오류가 발생했습니다.')
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">접근 권한이 없습니다</h1>
          <p className="mt-2 text-muted-foreground">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground">드론 대여 시스템 관리</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                승인 대기: {stats.pendingUsers}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 드론</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEquipment}</div>
              <p className="text-xs text-muted-foreground">
                사용 가능: {stats.availableEquipment}개
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대여 신청</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRentals}</div>
              <p className="text-xs text-muted-foreground">
                진행 중: {stats.activeRentals}건
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              계정 승인 대기 중
            </CardTitle>
            <CardDescription>
              승인 대기 중인 직원 계정 목록
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-yellow-600">
              {stats?.pendingUsers || 0}명
            </div>
            <Button className="w-full" onClick={() => window.location.href = '/admin/users?view=pending'}>
              계정 승인 관리
            </Button>
          </CardContent>
        </Card>

        <Card className={stats?.passwordResetRequests ? 'border-purple-500 shadow-lg' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              비밀번호 재설정 요청
              {stats && stats.passwordResetRequests > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-purple-600 rounded-full animate-pulse">
                  {stats.passwordResetRequests}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              비밀번호 재설정을 요청한 사용자
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-purple-600">
              {stats?.passwordResetRequests || 0}명
            </div>
            <Button className="w-full" onClick={() => window.location.href = '/admin/users?view=password-reset'}>
              비밀번호 재설정 관리
            </Button>
          </CardContent>
        </Card>

        <Card className={stats?.pendingRentals ? 'border-blue-500 shadow-lg' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              대여 승인 대기 중
              {stats && stats.pendingRentals > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full animate-pulse">
                  {stats.pendingRentals}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              승인 대기 중인 드론 대여 신청
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-blue-600">
              {stats?.pendingRentals || 0}건
            </div>
            <Button className="w-full" onClick={() => window.location.href = '/dashboard/rentals/manage'}>
              대여 승인 관리
            </Button>
          </CardContent>
        </Card>

        <Card className={stats?.returnPendingRentals ? 'border-orange-500 shadow-lg' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              반납 승인 대기 중
              {stats && stats.returnPendingRentals > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-600 rounded-full animate-pulse">
                  {stats.returnPendingRentals}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              반납 승인 대기 중인 드론 목록
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold text-orange-600">
              {stats?.returnPendingRentals || 0}건
            </div>
            <Button className="w-full" onClick={() => window.location.href = '/admin/returns'}>
              반납 완료 처리
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              사용자 관리
            </CardTitle>
            <CardDescription>
              직원 계정 및 권한 관리 (등급 멤버별 권한 설정)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => window.location.href = '/admin/users?view=all'}>
              전체 사용자 관리하기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              드론 관리
            </CardTitle>
            <CardDescription>
              드론 등록 및 상태 관리
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => window.location.href = '/admin/equipment'}>
              드론 관리하기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              전체 현황
            </CardTitle>
            <CardDescription>
              시스템 전체 현황 및 통계
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => window.location.href = '/admin/stats'}>
              전체 현황 보기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              장비 상태 동기화
            </CardTitle>
            <CardDescription>
              렌탈 상태와 장비 상태 동기화
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleSyncEquipment}
            >
              지금 동기화
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}