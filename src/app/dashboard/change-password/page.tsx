'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export default function ChangePassword() {
  const { data: session } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setError('새 비밀번호는 최소 6자 이상이어야 합니다.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(data.error || '비밀번호 변경 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setError('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
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

  if (success) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>비밀번호 변경 완료</CardTitle>
            <CardDescription>
              비밀번호가 성공적으로 변경되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800">✓ 비밀번호가 변경되었습니다.</p>
              <p className="text-sm text-green-600 mt-2">잠시 후 대시보드로 이동합니다...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
          <CardDescription>
            보안을 위해 정기적으로 비밀번호를 변경하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                현재 비밀번호
              </label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                placeholder="현재 비밀번호를 입력하세요"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                새 비밀번호
              </label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
                required
                placeholder="새 비밀번호를 입력하세요"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                최소 6자 이상 입력하세요
              </p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                새 비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="새 비밀번호를 다시 입력하세요"
                minLength={6}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
