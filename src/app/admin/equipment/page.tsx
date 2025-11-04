'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Package, Plus, Edit, Trash2 } from 'lucide-react'

interface Equipment {
  id: string
  name: string
  model: string
  serialNumber: string
  description: string
  status: string
  createdAt: string
}

export default function AdminEquipment() {
  const { data: session } = useSession()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    model: '',
    serialNumber: '',
    description: '',
  })

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      if (response.ok) {
        const data = await response.json()
        setEquipment(data)
      }
    } catch (error) {
      console.error('드론 데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const addEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEquipment),
      })

      if (response.ok) {
        setNewEquipment({ name: '', model: '', serialNumber: '', description: '' })
        setShowAddForm(false)
        fetchEquipment()
        alert('드론이 성공적으로 등록되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '드론 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('드론 등록 실패:', error)
      alert('드론 등록 중 오류가 발생했습니다.')
    }
  }

  const updateEquipmentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchEquipment()
      }
    } catch (error) {
      console.error('드론 상태 업데이트 실패:', error)
    }
  }

  const updateEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEquipment) return

    try {
      const response = await fetch(`/api/equipment/${editingEquipment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingEquipment.name,
          model: editingEquipment.model,
          serialNumber: editingEquipment.serialNumber,
          description: editingEquipment.description,
        }),
      })

      if (response.ok) {
        setEditingEquipment(null)
        fetchEquipment()
        alert('드론이 성공적으로 수정되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '드론 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('드론 수정 실패:', error)
      alert('드론 수정 중 오류가 발생했습니다.')
    }
  }

  const deleteEquipment = async (id: string, name: string) => {
    if (!confirm(`"${name}" 드론을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchEquipment()
        alert('드론이 성공적으로 삭제되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '드론 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('드론 삭제 실패:', error)
      alert('드론 삭제 중 오류가 발생했습니다.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800'
      case 'RENTED':
        return 'bg-blue-100 text-blue-800'
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800'
      case 'UNAVAILABLE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return '사용 가능'
      case 'RENTED':
        return '대여 중'
      case 'RESERVED':
        return '대여 예약'
      case 'UNAVAILABLE':
        return '사용 불가'
      default:
        return status
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">드론 관리</h1>
          <p className="text-muted-foreground">드론 장비 등록 및 상태 관리</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/sync-equipment-status', {
                  method: 'POST'
                })
                const data = await response.json()
                if (response.ok) {
                  alert(`동기화 완료: ${data.updates.length}개 드론 업데이트됨`)
                  fetchEquipment()
                } else {
                  alert(data.error || '동기화 실패')
                }
              } catch (error) {
                console.error('Sync error:', error)
                alert('동기화 중 오류가 발생했습니다.')
              }
            }}
          >
            상태 동기화
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 드론 등록
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 드론</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용 가능</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipment.filter(eq => eq.status === 'AVAILABLE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대여 중</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipment.filter(eq => eq.status === 'RENTED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대여 예약</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipment.filter(eq => eq.status === 'RESERVED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {editingEquipment && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>드론 수정</CardTitle>
            <CardDescription>선택한 드론의 정보를 수정합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateEquipment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">드론명</label>
                  <Input
                    value={editingEquipment.name}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">기체고유번호</label>
                  <Input
                    value={editingEquipment.model}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, model: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">시리얼 번호</label>
                  <Input
                    value={editingEquipment.serialNumber}
                    onChange={(e) => setEditingEquipment({ ...editingEquipment, serialNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  설명 <span className="text-xs text-muted-foreground">(선택사항 - 비우면 삭제됨)</span>
                </label>
                <Input
                  value={editingEquipment.description || ''}
                  onChange={(e) => setEditingEquipment({ ...editingEquipment, description: e.target.value })}
                  placeholder="설명을 입력하거나 비워두세요"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">수정 완료</Button>
                <Button type="button" variant="outline" onClick={() => setEditingEquipment(null)}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>새 드론 등록</CardTitle>
            <CardDescription>새로운 드론 장비를 시스템에 등록합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addEquipment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">드론명</label>
                  <Input
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    required
                    placeholder="예: DJI Mavic Air 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">기체고유번호</label>
                  <Input
                    value={newEquipment.model}
                    onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                    required
                    placeholder="예: MA2-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">시리얼 번호</label>
                  <Input
                    value={newEquipment.serialNumber}
                    onChange={(e) => setNewEquipment({ ...newEquipment, serialNumber: e.target.value })}
                    required
                    placeholder="예: DJI-001"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  설명 <span className="text-xs text-muted-foreground">(선택사항)</span>
                </label>
                <Input
                  value={newEquipment.description}
                  onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
                  placeholder="드론의 상세한 설명을 입력하세요 (선택사항)"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">등록</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>드론 목록</CardTitle>
          <CardDescription>등록된 모든 드론 목록 및 상태</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {equipment.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{eq.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {eq.model} | {eq.serialNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">{eq.description}</p>
                  <p className="text-xs text-muted-foreground">
                    등록일: {new Date(eq.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(eq.status)}`}>
                    {getStatusText(eq.status)}
                  </span>
                  <select
                    value={eq.status}
                    onChange={(e) => updateEquipmentStatus(eq.id, e.target.value)}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="AVAILABLE">사용 가능</option>
                    <option value="RENTED">대여 중</option>
                    <option value="RESERVED">대여 예약</option>
                    <option value="UNAVAILABLE">사용 불가</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingEquipment(eq)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteEquipment(eq.id, eq.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
