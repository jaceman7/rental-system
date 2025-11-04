'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle } from 'lucide-react'

interface Rental {
  id: string
  startDate: string
  endDate: string
  purpose: string
  status: string
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

export default function ReturnsManagement() {
  const { data: session } = useSession()
  const [returnPendingRentals, setReturnPendingRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchReturnPendingRentals()
    }
  }, [session])

  const fetchReturnPendingRentals = async () => {
    try {
      const response = await fetch('/api/admin/returns')
      if (response.ok) {
        const data = await response.json()
        setReturnPendingRentals(data)
      }
    } catch (error) {
      console.error('반납 대기 목록 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteReturn = async (rentalId: string) => {
    if (!confirm('반납을 완료 처리하시겠습니까?')) return

    try {
      const response = await fetch(`/api/admin/returns/${rentalId}/complete`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('반납이 완료되었습니다.')
        fetchReturnPendingRentals()
      } else {
        const error = await response.json()
        alert(error.error || '반납 완료 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('반납 완료 처리 실패:', error)
      alert('반납 완료 처리 중 오류가 발생했습니다.')
    }
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.level !== 'SUPER')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">접근 권한이 없습니다</h1>
          <p className="mt-2 text-muted-foreground">관리자 또는 슈퍼 멤버만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          드론 반납 관리
          {returnPendingRentals.length > 0 && (
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold leading-none text-white bg-orange-600 rounded-full animate-pulse">
              {returnPendingRentals.length}건 대기 중
            </span>
          )}
        </h1>
        <p className="text-muted-foreground">반납 대기 중인 드론을 확인하고 완료 처리합니다</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>반납 대기 중인 드론 목록</CardTitle>
          <CardDescription>
            직원이 반납 신청한 드론을 검수 후 반납 완료 처리하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">로딩 중...</p>
          ) : returnPendingRentals.length === 0 ? (
            <p className="text-muted-foreground">반납 대기 중인 드론이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {returnPendingRentals.map((rental) => (
                <div key={rental.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{rental.equipment.name}</h3>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                          반납 대기
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <p><strong>모델:</strong> {rental.equipment.model}</p>
                          <p><strong>시리얼:</strong> {rental.equipment.serialNumber}</p>
                        </div>
                        <div>
                          <p><strong>대여자:</strong> {rental.user.name} ({rental.user.email})</p>
                          <p><strong>대여 기간:</strong> {new Date(rental.startDate).toLocaleDateString()} ~ {new Date(rental.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm"><strong>사용 목적:</strong> {rental.purpose}</p>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        onClick={() => handleCompleteReturn(rental.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        반납 완료
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
