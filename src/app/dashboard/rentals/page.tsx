'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface Rental {
  id: string
  startDate: string
  endDate: string
  purpose: string
  status: string
  notes?: string
  createdAt: string
  equipment: {
    id: string
    name: string
    model: string
    serialNumber: string
  }
}

export default function MyRentals() {
  const { data: session } = useSession()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchMyRentals()
    }
  }, [session])

  const fetchMyRentals = async () => {
    try {
      const response = await fetch('/api/rentals/my')
      if (response.ok) {
        const data = await response.json()
        setRentals(data)
      }
    } catch (error) {
      console.error('대여 내역 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'RESERVED':
        return <Clock className="h-4 w-4 text-blue-500" />
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
      case 'RESERVED':
        return '대여 예약'
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
      case 'RESERVED':
        return 'bg-blue-100 text-blue-800'
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

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">로그인이 필요합니다</h1>
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
  const activeRentals = rentals.filter(r => r.status === 'ACTIVE' || r.status === 'APPROVED' || r.status === 'RESERVED')
  const completedRentals = rentals.filter(r => r.status === 'COMPLETED')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">내 대여 내역</h1>
        <p className="text-muted-foreground">나의 드론 장비 대여 신청 및 이용 내역</p>
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
            <div className="text-2xl font-bold">{completedRentals.length}</div>
          </CardContent>
        </Card>
      </div>

      {rentals.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>대여 내역이 없습니다</CardTitle>
            <CardDescription>
              아직 장비를 대여한 적이 없습니다. 사용 가능한 장비를 확인해보세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/dashboard'}>
              장비 목록 보기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>대여 내역</CardTitle>
            <CardDescription>
              최신 대여 신청부터 과거 내역까지 모든 기록을 확인할 수 있습니다.
            </CardDescription>
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
                        모델: {rental.equipment.model} | 시리얼: {rental.equipment.serialNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        대여 기간: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        사용 목적: {rental.purpose}
                      </p>
                      {rental.notes && (
                        <p className="text-sm text-muted-foreground">
                          관리자 메모: {rental.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        신청일: {new Date(rental.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(rental.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}