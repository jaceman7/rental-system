'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

interface Rental {
  id: string
  userId: string
  equipmentId: string
  startDate: string
  endDate: string
  purpose: string
  status: string
  notes: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  equipment: {
    id: string
    name: string
    model: string
    serialNumber: string
  }
}

export default function RentalsManagePage() {
  const { data: session } = useSession()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchRentals()
    }
  }, [session])

  const fetchRentals = async () => {
    try {
      const response = await fetch('/api/rentals')
      if (response.ok) {
        const data = await response.json()
        setRentals(data)
      }
    } catch (error) {
      console.error('대여 데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (rentalId: string) => {
    if (!confirm('이 대여 신청을 승인하시겠습니까?')) return

    try {
      const response = await fetch(`/api/rentals/${rentalId}/approve`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('대여가 승인되었습니다.')
        fetchRentals()
      } else {
        const error = await response.json()
        alert(error.error || '승인에 실패했습니다.')
      }
    } catch (error) {
      console.error('승인 실패:', error)
      alert('승인 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async (rentalId: string) => {
    const reason = prompt('거부 사유를 입력하세요:')
    if (!reason) return

    try {
      const response = await fetch(`/api/rentals/${rentalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: reason })
      })

      if (response.ok) {
        alert('대여가 거부되었습니다.')
        fetchRentals()
      } else {
        const error = await response.json()
        alert(error.error || '거부에 실패했습니다.')
      }
    } catch (error) {
      console.error('거부 실패:', error)
      alert('거부 중 오류가 발생했습니다.')
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">로그인이 필요합니다</h1>
        </div>
      </div>
    )
  }

  if (session.user.level !== 'SUPER' && session.user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">접근 권한이 없습니다</h1>
          <p className="mt-2 text-muted-foreground">슈퍼 멤버 또는 관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  const pendingRentals = rentals.filter(r => r.status === 'PENDING')
  const approvedRentals = rentals.filter(r => r.status === 'APPROVED' || r.status === 'ACTIVE')
  const completedRentals = rentals.filter(r => r.status === 'COMPLETED')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          대여 승인 관리
          {pendingRentals.length > 0 && (
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
              {pendingRentals.length}건 대기 중
            </span>
          )}
        </h1>
        <p className="text-muted-foreground">대여 신청을 승인하거나 거부할 수 있습니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRentals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">승인됨/대여중</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRentals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료됨</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRentals.length}</div>
          </CardContent>
        </Card>
      </div>

      {pendingRentals.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              승인 대기 중인 대여 신청
            </CardTitle>
            <CardDescription>
              대여 신청을 검토하고 승인 또는 거부하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRentals.map((rental) => (
                <div key={rental.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{rental.equipment.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      신청자: {rental.user.name} ({rental.user.email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      기간: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      목적: {rental.purpose}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      신청일: {new Date(rental.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(rental.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(rental.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      거부
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>전체 대여 목록</CardTitle>
          <CardDescription>
            모든 대여 내역
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rentals.length === 0 ? (
              <p className="text-muted-foreground">대여 내역이 없습니다.</p>
            ) : (
              rentals.map((rental) => (
                <div key={rental.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{rental.equipment.name}</h3>
                      {rental.status === 'PENDING' && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          승인 대기
                        </span>
                      )}
                      {rental.status === 'APPROVED' && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          승인됨
                        </span>
                      )}
                      {rental.status === 'ACTIVE' && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          대여 중
                        </span>
                      )}
                      {rental.status === 'COMPLETED' && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          완료됨
                        </span>
                      )}
                      {rental.status === 'REJECTED' && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          거부됨
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      신청자: {rental.user.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      기간: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                    </p>
                    {rental.notes && (
                      <p className="text-sm text-red-500 mt-1">
                        비고: {rental.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
