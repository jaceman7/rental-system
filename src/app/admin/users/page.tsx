'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, User, Clock } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  level: string
  approved: boolean
  passwordResetRequested: boolean
  passwordResetRequestedAt: string | null
  createdAt: string
  _count: {
    rentals: number
  }
}

export default function AdminUsers() {
  const { data: session } = useSession()
  const [view, setView] = useState('all')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLevels, setSelectedLevels] = useState<Record<string, string>>({})

  useEffect(() => {
    // Get view from URL on client side only
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const viewParam = params.get('view')
      if (viewParam) {
        setView(viewParam)
      }
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        console.log('fetchUsers - 받은 데이터:', data)
        setUsers(data)
        console.log('fetchUsers - users 상태 업데이트 완료')
      }
    } catch (error) {
      console.error('사용자 데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      console.log('업데이트 요청:', userId, updates)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      console.log('응답 상태:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('업데이트 성공:', data)
        console.log('사용자 목록 새로고침 시작...')
        await fetchUsers()
        console.log('사용자 목록 새로고침 완료')
        // selectedLevels 상태 초기화
        setSelectedLevels(prev => {
          const newState = { ...prev }
          delete newState[userId]
          return newState
        })
        alert('등급이 성공적으로 변경되었습니다!')
        return true
      } else {
        const error = await response.json()
        console.error('사용자 업데이트 실패:', error)
        alert('업데이트 실패: ' + (error.error || '알 수 없는 오류'))
        return false
      }
    } catch (error) {
      console.error('사용자 업데이트 실패:', error)
      alert('업데이트 중 오류가 발생했습니다.')
      return false
    }
  }

  const approveUser = async (userId: string) => {
    const success = await updateUser(userId, { approved: true })
    if (success) {
      alert('사용자가 승인되었습니다.\n사용자는 로그아웃 후 다시 로그인해야 합니다.')
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers()
        return true
      } else {
        const error = await response.json()
        console.error('사용자 삭제 실패:', error)
        alert('삭제 실패: ' + (error.error || '알 수 없는 오류'))
        return false
      }
    } catch (error) {
      console.error('사용자 삭제 실패:', error)
      alert('삭제 중 오류가 발생했습니다.')
      return false
    }
  }

  const rejectUser = async (userId: string) => {
    if (confirm('이 사용자의 가입을 거부하시겠습니까?\n거부된 사용자는 목록에서 삭제됩니다.')) {
      const success = await deleteUser(userId)
      if (success) {
        alert('사용자가 삭제되었습니다.')
      }
    }
  }

  const cancelApproval = async (userId: string) => {
    if (confirm('정말 이 사용자의 승인을 취소하시겠습니까?')) {
      const success = await updateUser(userId, { approved: false })
      if (success) {
        alert('사용자의 승인이 취소되었습니다.')
      }
    }
  }

  const resetPassword = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        await fetchUsers()
        alert(
          `${data.userName}님의 임시 비밀번호가 생성되었습니다.\n\n` +
          `사용자는 비밀번호 찾기 페이지에서 임시 비밀번호를 확인할 수 있습니다.\n` +
          `사용자에게 비밀번호 찾기 페이지에서 확인하도록 안내해주세요.`
        )
      } else {
        const error = await response.json()
        alert('비밀번호 재설정 실패: ' + (error.error || '알 수 없는 오류'))
      }
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error)
      alert('비밀번호 재설정 중 오류가 발생했습니다.')
    }
  }

  const cancelPasswordResetRequest = async (userId: string, userName: string) => {
    if (!confirm(`${userName}님의 비밀번호 재설정 요청을 취소하시겠습니까?`)) return

    try {
      const success = await updateUser(userId, {
        passwordResetRequested: false,
        passwordResetRequestedAt: null
      })

      if (success) {
        alert('비밀번호 재설정 요청이 취소되었습니다.')
      }
    } catch (error) {
      console.error('비밀번호 재설정 요청 취소 실패:', error)
      alert('비밀번호 재설정 요청 취소 중 오류가 발생했습니다.')
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

  const pendingUsers = users.filter(user => !user.approved)
  const approvedUsers = users.filter(user => user.approved && user.role !== 'ADMIN')
  const approvedUsersCount = users.filter(user => user.approved && user.role !== 'ADMIN').length
  const passwordResetRequestedUsers = users.filter(user => user.passwordResetRequested)
  const adminCount = users.filter(user => user.role === 'ADMIN').length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {view === 'pending' ? '계정 승인 대기 중' : view === 'password-reset' ? '비밀번호 재설정 요청' : '사용자 관리'}
        </h1>
        <p className="text-muted-foreground">
          {view === 'pending' ? '승인 대기 중인 직원 계정' : view === 'password-reset' ? '비밀번호 재설정을 요청한 사용자' : '전체 직원 계정 관리'}
        </p>
      </div>

      {view === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">승인된 사용자</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedUsersCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingUsers.length}</div>
            </CardContent>
          </Card>

          <Card className={passwordResetRequestedUsers.length > 0 ? 'border-orange-500' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">비밀번호 재설정 요청</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{passwordResetRequestedUsers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">관리자</CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(user => user.role === 'ADMIN').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'pending' && pendingUsers.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              승인 대기 중인 사용자
            </CardTitle>
            <CardDescription>
              새로 가입한 사용자들의 계정을 승인하거나 거부할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      가입일: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLevels[user.id] ?? user.level ?? 'NORMAL'}
                      onChange={(e) => {
                        setSelectedLevels(prev => ({ ...prev, [user.id]: e.target.value }))
                      }}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="NORMAL">일반 멤버</option>
                      <option value="SUPER">슈퍼 멤버</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const newLevel = selectedLevels[user.id] ?? user.level ?? 'NORMAL'
                        alert(`등급 변경 버튼 클릭됨: ${user.name} → ${newLevel}`)
                        console.log('등급 변경:', user.id, newLevel)
                        updateUser(user.id, { level: newLevel })
                      }}
                    >
                      등급 변경
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveUser(user.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectUser(user.id)}
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

      {view === 'pending' && pendingUsers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">승인 대기 중인 사용자가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {view === 'password-reset' && passwordResetRequestedUsers.length > 0 && (
        <Card className="mb-6 border-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              비밀번호 재설정 요청 사용자
            </CardTitle>
            <CardDescription>
              비밀번호 재설정을 요청한 사용자에게 임시 비밀번호를 발급할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {passwordResetRequestedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-purple-50">
                  <div className="flex-1">
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      요청일: {user.passwordResetRequestedAt ? new Date(user.passwordResetRequestedAt).toLocaleString() : '-'}
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-1">
                      등급: {user.level === 'SUPER' ? '슈퍼 멤버' : '일반 멤버'} | 역할: {user.role === 'ADMIN' ? '관리자' : '직원'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => resetPassword(user.id)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      임시 비밀번호 발급
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelPasswordResetRequest(user.id, user.name)}
                    >
                      요청 취소
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'password-reset' && passwordResetRequestedUsers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">비밀번호 재설정 요청이 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {view === 'all' && passwordResetRequestedUsers.length > 0 && (
        <Card className="mb-6 border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              🔑 비밀번호 재설정 요청 ({passwordResetRequestedUsers.length}명)
            </CardTitle>
            <CardDescription>
              비밀번호 재설정을 요청한 사용자들입니다. "비밀번호 재설정" 버튼을 클릭하여 임시 비밀번호를 발급하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {passwordResetRequestedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-lg">{user.name}</h3>
                      {user.level === 'SUPER' && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          슈퍼 멤버
                        </span>
                      )}
                      {user.level === 'NORMAL' && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          일반 멤버
                        </span>
                      )}
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-semibold animate-pulse">
                        🔑 비밀번호 재설정 요청
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                    {user.passwordResetRequestedAt && (
                      <p className="text-xs text-orange-600 font-medium mt-1">
                        요청일시: {new Date(user.passwordResetRequestedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => resetPassword(user.id)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      🔑 비밀번호 재설정
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelPasswordResetRequest(user.id, user.name)}
                    >
                      요청 취소
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>전체 사용자 목록</CardTitle>
            <CardDescription>
              승인된 사용자 목록
            </CardDescription>
          </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {approvedUsers.length === 0 ? (
              <p className="text-muted-foreground">승인된 사용자가 없습니다.</p>
            ) : (
              approvedUsers.map((user) => (
              <div key={user.id} className={`flex items-center justify-between p-4 border rounded-lg ${user.passwordResetRequested ? 'bg-orange-50 border-orange-300' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{user.name}</h3>
                    {user.role === 'ADMIN' && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        관리자
                      </span>
                    )}
                    {user.level === 'SUPER' && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        슈퍼 멤버
                      </span>
                    )}
                    {user.level === 'NORMAL' && (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                        일반 멤버
                      </span>
                    )}
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      승인됨
                    </span>
                    {user.passwordResetRequested && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded font-semibold animate-pulse">
                        🔑 비밀번호 재설정 요청
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    대여 건수: {user._count.rentals}건 | 가입일: {new Date(user.createdAt).toLocaleDateString()}
                    {user.passwordResetRequestedAt && (
                      <span className="ml-2 text-orange-600 font-medium">
                        | 재설정 요청일: {new Date(user.passwordResetRequestedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedLevels[user.id] ?? user.level ?? 'NORMAL'}
                    onChange={(e) => {
                      setSelectedLevels(prev => ({ ...prev, [user.id]: e.target.value }))
                    }}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="NORMAL">일반 멤버</option>
                    <option value="SUPER">슈퍼 멤버</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const newLevel = selectedLevels[user.id] ?? user.level ?? 'NORMAL'
                      alert(`등급 변경 버튼 클릭됨: ${user.name} → ${newLevel}`)
                      console.log('등급 변경:', user.id, newLevel)
                      updateUser(user.id, { level: newLevel })
                    }}
                  >
                    등급 변경
                  </Button>
                  {user.approved && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetPassword(user.id, user.name)}
                        className="bg-orange-50 hover:bg-orange-100"
                      >
                        비밀번호 재설정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelApproval(user.id)}
                      >
                        승인 취소
                      </Button>
                    </>
                  )}
                </div>
              </div>
              ))
            )}
          </div>
        </CardContent>
        </Card>
      )}
    </div>
  )
}
