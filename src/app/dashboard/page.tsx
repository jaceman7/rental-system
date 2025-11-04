'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Package, Clock, CheckCircle, AlertCircle, XCircle, Bell } from 'lucide-react'

interface Equipment {
  id: string
  name: string
  model: string
  serialNumber: string
  description: string
  status: string
}

interface Rental {
  id: string
  startDate: string
  endDate: string
  purpose: string
  status: string
  equipment: Equipment
  user?: {
    id: string
    name: string
    email: string
  }
}

interface NotificationData {
  pendingRentals: number
  returnPendingRentals: number
  totalNotifications: number
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [myRentals, setMyRentals] = useState<Rental[]>([])
  const [allRentals, setAllRentals] = useState<Rental[]>([])
  const [notifications, setNotifications] = useState<NotificationData>({
    pendingRentals: 0,
    returnPendingRentals: 0,
    totalNotifications: 0,
  })

  useEffect(() => {
    if (session) {
      // 페이지 로드 시 자동 동기화
      syncEquipmentStatus()
      fetchEquipment()
      fetchMyRentals()
      fetchAllRentals()
      if (session.user.level === 'SUPER') {
        fetchNotifications()
        // 30초마다 알림 데이터 갱신
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
      }
    }
  }, [session])

  const syncEquipmentStatus = async () => {
    try {
      // 조용히 백그라운드에서 동기화 (에러 무시)
      await fetch('/api/equipment/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      // 에러 무시 (사용자에게 표시하지 않음)
      console.log('Auto-sync completed')
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      if (response.ok) {
        const data = await response.json()
        setEquipment(data)
      }
    } catch (error) {
      console.error('드론 데이터 로딩 실패:', error)
    }
  }

  const fetchMyRentals = async () => {
    try {
      const response = await fetch('/api/rentals/my')
      if (response.ok) {
        const data = await response.json()
        setMyRentals(data)
      }
    } catch (error) {
      console.error('대여 내역 로딩 실패:', error)
    }
  }

  const fetchAllRentals = async () => {
    try {
      const response = await fetch('/api/rentals/all')
      if (response.ok) {
        const data = await response.json()
        setAllRentals(data)
      }
    } catch (error) {
      console.error('전체 대여 목록 로딩 실패:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('알림 데이터 로딩 실패:', error)
    }
  }

  const calculateDday = (targetDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(targetDate)
    target.setHours(0, 0, 0, 0)

    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'D-DAY'
    if (diffDays > 0) return `D-${diffDays}`
    return `D+${Math.abs(diffDays)}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'RESERVED':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'APPROVED':
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'RETURN_PENDING':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'REJECTED':
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '승인 대기'
      case 'RESERVED':
        return '대여 예약'
      case 'APPROVED':
        return '승인됨'
      case 'REJECTED':
        return '거부됨'
      case 'ACTIVE':
        return '대여 중'
      case 'RETURN_PENDING':
        return '반납 대기'
      case 'COMPLETED':
        return '완료'
      case 'CANCELLED':
        return '취소됨'
      default:
        return status
    }
  }

  const handleReturnRequest = async (rentalId: string) => {
    if (!confirm('이 드론을 반납하시겠습니까?')) return

    try {
      const response = await fetch(`/api/rentals/${rentalId}/return`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('반납 신청이 완료되었습니다.')
        fetchMyRentals()
      } else {
        const error = await response.json()
        alert(error.error || '반납 신청에 실패했습니다.')
      }
    } catch (error) {
      console.error('반납 신청 실패:', error)
      alert('반납 신청 중 오류가 발생했습니다.')
    }
  }

  const handleCancelReservation = async (rentalId: string) => {
    if (!confirm('이 예약을 취소하시겠습니까?')) return

    try {
      const response = await fetch(`/api/rentals/${rentalId}/cancel`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('예약이 취소되었습니다.')
        fetchMyRentals()
      } else {
        const error = await response.json()
        alert(error.error || '예약 취소에 실패했습니다.')
      }
    } catch (error) {
      console.error('예약 취소 실패:', error)
      alert('예약 취소 중 오류가 발생했습니다.')
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">로그인이 필요합니다</h1>
          <p className="mt-2 text-muted-foreground">대시보드에 접근하려면 로그인하세요.</p>
        </div>
      </div>
    )
  }


  const rentedEquipment = equipment.filter(eq => eq.status === 'RENTED')
  const reservedEquipment = equipment.filter(eq => eq.status === 'RESERVED')
  const activeRentals = allRentals.filter(r => r.status === 'ACTIVE' || r.status === 'RETURN_PENDING')
  const reservedRentals = allRentals.filter(r => r.status === 'RESERVED')

  // 현재 대여 중인 장비 ID 목록 (ACTIVE, RETURN_PENDING만)
  const equipmentIdsWithActiveRentals = activeRentals.map(r => r.equipmentId)

  // 사용 가능한 드론: 현재 대여 중(ACTIVE)이 아니고, 유지보수 중이 아닌 드론
  const availableEquipment = equipment.filter(eq =>
    !equipmentIdsWithActiveRentals.includes(eq.id) && eq.status !== 'MAINTENANCE'
  )

  // 예약 가능한 드론: 현재 대여 중(ACTIVE, RETURN_PENDING)인 드론만
  const reservableEquipment = equipment.filter(eq =>
    equipmentIdsWithActiveRentals.includes(eq.id)
  )

  // 예약 가능한 드론에 다음 예약 가능 날짜 정보 추가
  const reservableWithNextDate = reservableEquipment.map(eq => {
    // 해당 드론의 가장 늦은 반납일 찾기
    const equipmentRentals = [...activeRentals, ...reservedRentals].filter(r => r.equipmentId === eq.id)
    if (equipmentRentals.length === 0) {
      return { ...eq, nextAvailableDate: null }
    }
    const latestEndDate = equipmentRentals.reduce((latest, rental) => {
      const endDate = new Date(rental.endDate)
      return endDate > latest ? endDate : latest
    }, new Date(0))

    // 반납일 다음날
    const nextDate = new Date(latestEndDate)
    nextDate.setDate(nextDate.getDate() + 1)

    return { ...eq, nextAvailableDate: nextDate }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">직원 대시보드</h1>
          <p className="text-muted-foreground">안녕하세요, {session.user.name}님!</p>
        </div>
        {session.user.level === 'SUPER' && (
          <div className="flex gap-2">
            <Button
              onClick={() => window.location.href = '/dashboard/rentals/manage'}
              className="relative"
            >
              대여 승인 관리
              {notifications.pendingRentals > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {notifications.pendingRentals}
                </span>
              )}
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/returns'}
              variant="outline"
              className="relative"
            >
              반납 승인 관리
              {notifications.returnPendingRentals > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-600 rounded-full">
                  {notifications.returnPendingRentals}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용 가능한 드론</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableEquipment.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">내 전체 대여 기록</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myRentals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">내 신청 승인 대기 중</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myRentals.filter(r => r.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">내 대여 예약</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myRentals.filter(r => r.status === 'RESERVED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">내 대여 중</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myRentals.filter(r => r.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>전체 드론 목록</CardTitle>
            <CardDescription>
              시스템에 등록된 모든 드론
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {equipment.length === 0 ? (
                <p className="text-muted-foreground">등록된 드론이 없습니다.</p>
              ) : (
                equipment.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{eq.name}</h3>
                      <p className="text-sm text-muted-foreground">장치신고번호: {eq.model}</p>
                      <p className="text-xs text-muted-foreground mt-1">S/N: {eq.serialNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {eq.status === 'AVAILABLE' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-500">사용 가능</span>
                        </>
                      ) : eq.status === 'RENTED' ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-orange-500">대여 중</span>
                        </>
                      ) : eq.status === 'RESERVED' ? (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-yellow-500">대여 예약</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-500">사용 불가</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>현재 대여 중인 드론</CardTitle>
            <CardDescription>
              다른 직원이 대여 중인 드론 목록
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeRentals.length === 0 ? (
                <p className="text-muted-foreground">현재 대여 중인 드론이 없습니다.</p>
              ) : (
                activeRentals.map((rental) => {
                  const dday = calculateDday(rental.endDate)
                  return (
                    <div key={rental.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{rental.equipment.name}</h3>
                        <p className="text-sm text-muted-foreground">장치신고번호: {rental.equipment.model}</p>
                        <p className="text-xs text-muted-foreground mt-1">S/N: {rental.equipment.serialNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          대여자: {rental.user?.name || '알 수 없음'}
                        </p>
                        <p className="text-xs font-semibold text-orange-600 mt-1">
                          반납일: {new Date(rental.endDate).toLocaleDateString()} ({dday})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-orange-500">대여 중</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>대여 예약 중인 드론</CardTitle>
            <CardDescription>
              예약된 드론 목록
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reservedRentals.length === 0 ? (
                <p className="text-muted-foreground">대여 예약 중인 드론이 없습니다.</p>
              ) : (
                reservedRentals.map((rental) => {
                  const dday = calculateDday(rental.startDate)
                  return (
                    <div key={rental.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{rental.equipment.name}</h3>
                        <p className="text-sm text-muted-foreground">장치신고번호: {rental.equipment.model}</p>
                        <p className="text-xs text-muted-foreground mt-1">S/N: {rental.equipment.serialNumber}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          예약자: {rental.user?.name || '알 수 없음'}
                        </p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">
                          시작일: {new Date(rental.startDate).toLocaleDateString()} ({dday})
                        </p>
                        <p className="text-xs font-semibold text-blue-600 mt-1">
                          반납일: {new Date(rental.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-500">예약</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>내 대여 내역</CardTitle>
            <CardDescription>
              최근 대여 신청 및 현황
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myRentals.length === 0 ? (
                <p className="text-muted-foreground">대여 내역이 없습니다.</p>
              ) : (
                myRentals.slice(0, 5).map((rental) => (
                  <div key={rental.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{rental.equipment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(rental.status)}
                      <span className="text-sm">{getStatusText(rental.status)}</span>
                      {rental.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturnRequest(rental.id)}
                        >
                          반납 신청
                        </Button>
                      )}
                      {rental.status === 'RESERVED' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelReservation(rental.id)}
                        >
                          예약 취소
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {myRentals.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = '/dashboard/rentals'}
                >
                  전체 대여 내역 보기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>사용 가능한 드론</CardTitle>
            <CardDescription>
              현재 즉시 대여 가능한 드론 목록
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableEquipment.length === 0 ? (
                <p className="text-muted-foreground">현재 사용 가능한 드론이 없습니다.</p>
              ) : (
                availableEquipment.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{eq.name}</h3>
                      <p className="text-sm text-muted-foreground">장치신고번호: {eq.model}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => window.location.href = `/dashboard/rent/${eq.id}`}
                    >
                      대여 신청
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>예약 가능한 드론</CardTitle>
            <CardDescription>
              반납일 이후 예약 가능한 드론 목록 (사용 불가 드론 제외)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reservableWithNextDate.length === 0 ? (
                <p className="text-muted-foreground">예약 가능한 드론이 없습니다.</p>
              ) : (
                reservableWithNextDate.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{eq.name}</h3>
                      <p className="text-sm text-muted-foreground">장치신고번호: {eq.model}</p>
                      {eq.nextAvailableDate && (
                        <p className="text-xs text-blue-600 mt-1">
                          예약 가능일: {eq.nextAvailableDate.toLocaleDateString()} 이후
                        </p>
                      )}
                      {!eq.nextAvailableDate && eq.status === 'AVAILABLE' && (
                        <p className="text-xs text-green-600 mt-1">
                          즉시 대여 가능
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={eq.status === 'AVAILABLE' ? 'default' : 'outline'}
                      onClick={() => window.location.href = `/dashboard/rent/${eq.id}`}
                    >
                      {eq.status === 'AVAILABLE' ? '대여 신청' : '예약 신청'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}