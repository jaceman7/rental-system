'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [showTempPassword, setShowTempPassword] = useState(false)
  const router = useRouter()

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

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || '비밀번호 재설정 요청 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setError('비밀번호 재설정 요청 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckTempPassword = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/get-temp-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setTempPassword(data.tempPassword)
        setShowTempPassword(true)
      } else {
        setError(data.error || '임시 비밀번호 확인 중 오류가 발생했습니다.')
      }
    } catch (error) {
      setError('임시 비밀번호 확인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>비밀번호 재설정 요청 완료</CardTitle>
            <CardDescription>
              관리자가 확인 후 비밀번호를 재설정해드립니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ 비밀번호 재설정 요청이 접수되었습니다.
              </p>
              <p className="text-sm text-green-600 mt-2">
                관리자에게 연락하여 처리를 요청하세요.
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 관리자가 임시 비밀번호를 생성하면 아래 버튼으로 확인할 수 있습니다.
              </p>
            </div>

            {showTempPassword ? (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm font-medium text-purple-900 mb-2">임시 비밀번호</p>
                <div className="bg-white p-3 rounded border border-purple-300">
                  <p className="text-2xl font-mono font-bold text-center text-purple-700">
                    {tempPassword}
                  </p>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  ※ 이 비밀번호로 로그인 후 즉시 비밀번호를 변경하세요.
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  ※ 임시 비밀번호는 24시간 동안 유효합니다.
                </p>
              </div>
            ) : (
              <Button
                onClick={handleCheckTempPassword}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? '확인 중...' : '임시 비밀번호 확인'}
              </Button>
            )}

            {error && (
              <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full"
              variant="outline"
            >
              로그인 페이지로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>비밀번호 찾기</CardTitle>
          <CardDescription>
            본인 확인을 위해 이메일과 이름을 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="가입 시 사용한 이메일을 입력하세요"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                이름
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="가입 시 사용한 이름을 입력하세요"
              />
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                ⚠️ 요청 접수 후 관리자에게 연락하여 임시 비밀번호를 받으세요.
              </p>
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '요청 중...' : '비밀번호 재설정 요청'}
            </Button>
            <div className="text-center text-sm space-y-2">
              <div>
                <Link href="/auth/signin" className="text-primary hover:underline">
                  로그인으로 돌아가기
                </Link>
              </div>
              <div>
                계정이 없으신가요?{' '}
                <Link href="/auth/signup" className="text-primary hover:underline">
                  회원가입
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
