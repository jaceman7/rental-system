'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface Rental {
  id: string
  startDate: string
  endDate: string
  purpose: string
  status: string
  notes?: string
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

export default function AdminRentals() {
  const { data: session } = useSession()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRentals()
  }, [])

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

  const updateRentalStatus = async (id: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/rentals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      })

      if (response.ok) {
        fetchRentals()
      }
    } catch (error) {
      console.error('대여 상태 업데이트 실패:', error)
    }
  }

  const approveRental = (id: string) => {
    updateRentalStatus(id, 'APPROVED')
  }

  const rejectRental = (id: string) => {
    const reason = prompt('거부 사유를 입력하세요:')
    if (reason) {
      updateRentalStatus(id, 'REJECTED', reason)
    }
  }

  const completeRental = (id: string) => {
    updateRentalStatus(id, 'COMPLETED')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-gray-500" />
      case 'CANCELLED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '승인 대기'
      case 'APPROVED':
        return '승인됨'
      case 'REJECTED':
        return '거부됨'
      case 'ACTIVE':
        return '대여 중'
      case 'COMPLETED':
        return '완료'
      case 'CANCELLED':
        return '취소됨'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">접근 권한이 없습니다</h1>
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

  const pendingRentals = rentals.filter(rental => rental.status === 'PENDING')
  const activeRentals = rentals.filter(rental => rental.status === 'ACTIVE' || rental.status === 'APPROVED')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          대여 관리
          {pendingRentals.length > 0 && (
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
              {pendingRentals.length}건 대기 중
            </span>
          )}
        </h1>
        <p className="text-muted-foreground">대여 신청 승인 및 관리</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 대여</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rentals.length}</div>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">진행 중</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRentals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rentals.filter(r => r.status === 'COMPLETED').length}
            </div>
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
              새로운 대여 신청을 검토하고 승인하거나 거부할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRentals.map((rental) => (
                <div key={rental.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{rental.equipment.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(rental.status)}`}>
                          {getStatusText(rental.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        신청자: {rental.user.name} ({rental.user.email})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        기간: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        용도: {rental.purpose}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        신청일: {new Date(rental.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => approveRental(rental.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectRental(rental.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        거부
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>전체 대여 내역</CardTitle>
          <CardDescription>시스템의 모든 대여 내역</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rentals.map((rental) => (
              <div key={rental.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{rental.equipment.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(rental.status)}`}>
                        {getStatusText(rental.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      신청자: {rental.user.name} ({rental.user.email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      기간: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      용도: {rental.purpose}
                    </p>
                    {rental.notes && (
                      <p className="text-sm text-muted-foreground">
                        비고: {rental.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      신청일: {new Date(rental.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {rental.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        onClick={() => completeRental(rental.id)}
                      >
                        완료 처리
                      </Button>
                    )}
                    {rental.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => approveRental(rental.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectRental(rental.id)}
                        >
                          거부
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}