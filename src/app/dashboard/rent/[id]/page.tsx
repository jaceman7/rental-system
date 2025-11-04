'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

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
  status: string
  user: {
    name: string
  }
}

export default function RentEquipment({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const unwrappedParams = use(params)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [reservedRentals, setReservedRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    purpose: '',
  })

  useEffect(() => {
    fetchEquipment()
    fetchReservedRentals()
  }, [])

  const fetchEquipment = async () => {
    try {
      const response = await fetch(`/api/equipment/${unwrappedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setEquipment(data)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('드론 데이터 로딩 실패:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchReservedRentals = async () => {
    try {
      const response = await fetch(`/api/equipment/${unwrappedParams.id}/rentals`)
      if (response.ok) {
        const data = await response.json()
        setReservedRentals(data)
      }
    } catch (error) {
      console.error('예약 데이터 로딩 실패:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 제출 전 최종 날짜 충돌 검사
    if (isDateRangeConflict(formData.startDate, formData.endDate)) {
      alert('⚠️ 선택하신 기간은 이미 예약되어 있습니다.\n대여 불가 기간을 확인하고 다른 날짜를 선택해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipmentId: unwrappedParams.id,
          ...formData,
        }),
      })

      if (response.ok) {
        alert('대여 신청이 성공적으로 제출되었습니다!')
        router.push('/dashboard')
      } else {
        const error = await response.json()
        alert(error.error || '대여 신청에 실패했습니다.')
      }
    } catch (error) {
      console.error('대여 신청 실패:', error)
      alert('대여 신청 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const isDateRangeConflict = (start: string, end: string): boolean => {
    if (!start || !end) return false

    const startDate = new Date(start)
    const endDate = new Date(end)

    return reservedRentals.some((rental) => {
      const rentalStart = new Date(rental.startDate)
      const rentalEnd = new Date(rental.endDate)

      // 날짜 범위가 겹치는지 확인
      return startDate <= rentalEnd && endDate >= rentalStart
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // 날짜 변경 시 충돌 검사
    if (name === 'startDate' || name === 'endDate') {
      const newFormData = {
        ...formData,
        [name]: value,
      }

      // 시작일과 종료일이 모두 입력되었을 때 충돌 검사
      if (newFormData.startDate && newFormData.endDate) {
        if (isDateRangeConflict(newFormData.startDate, newFormData.endDate)) {
          alert('⚠️ 선택하신 기간은 이미 예약되어 있습니다.\n대여 불가 기간을 확인하고 다른 날짜를 선택해주세요.')
          // 날짜를 초기화하지 않고 사용자가 수정하도록 허용
        }
      }
    }

    setFormData({
      ...formData,
      [name]: value,
    })
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

  if (!equipment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">드론을 찾을 수 없습니다</h1>
        </div>
      </div>
    )
  }

  if (equipment.status === 'UNAVAILABLE' || equipment.status === 'MAINTENANCE') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>대여 불가</CardTitle>
            <CardDescription>
              현재 이 드론은 대여할 수 없는 상태입니다. (상태: {equipment.status === 'UNAVAILABLE' ? '사용 불가' : '점검 중'})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')}>
              대시보드로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 오늘 날짜를 기본값으로 설정
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">드론 대여 신청</h1>
          <p className="text-muted-foreground">선택한 드론의 대여를 신청합니다</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>선택한 드론</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{equipment.name}</h3>
              <p className="text-sm text-muted-foreground">
                모델: {equipment.model} | 시리얼: {equipment.serialNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                {equipment.description}
              </p>
              {equipment.status === 'AVAILABLE' ? (
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  즉시 사용 가능
                </span>
              ) : equipment.status === 'RENTED' ? (
                <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                  대여 중 (예약 가능)
                </span>
              ) : (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  예약됨 (추가 예약 가능)
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>대여 신청서</CardTitle>
            <CardDescription>
              대여 기간과 용도를 입력해주세요. 관리자 승인 후 대여가 가능합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium mb-2">
                    대여 시작일 *
                  </label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={today}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium mb-2">
                    대여 종료일 *
                  </label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || tomorrow}
                    required
                  />
                </div>
              </div>

              {reservedRentals.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ 대여 불가 기간</h4>
                  <p className="text-xs text-red-600 mb-3">
                    다음 기간은 이미 예약되어 있어 대여할 수 없습니다:
                  </p>
                  <div className="space-y-2">
                    {reservedRentals.map((rental) => (
                      <div key={rental.id} className="bg-white border border-red-300 rounded px-3 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-red-900">
                              {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-red-600 ml-2">
                              ({rental.user.name}님 {rental.status === 'RESERVED' ? '예약' : '대여 중'})
                            </span>
                          </div>
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                            대여 불가
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium mb-2">
                  사용 목적 *
                </label>
                <textarea
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="드론 사용 목적과 계획을 상세히 입력해주세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? '신청 중...' : '대여 신청'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}