'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Bell } from 'lucide-react'

interface NotificationData {
  pendingRentals: number
  returnPendingRentals: number
  pendingUsers: number
  passwordResetRequests: number
  totalNotifications: number
}

export default function Navbar() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<NotificationData>({
    pendingRentals: 0,
    returnPendingRentals: 0,
    pendingUsers: 0,
    passwordResetRequests: 0,
    totalNotifications: 0,
  })

  useEffect(() => {
    if (session?.user.role === 'ADMIN' || session?.user.level === 'SUPER') {
      fetchNotifications()
      // 30초마다 알림 데이터 갱신
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

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

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              드론 대여 시스템
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {session.user.role === 'ADMIN'
                    ? `관리자 (${session.user.name})`
                    : `${session.user.name} (${session.user.level === 'SUPER' ? '슈퍼 멤버' : '일반 멤버'})`
                  }
                </span>
                {session.user.role === 'ADMIN' && (
                  <>
                    <Link
                      href="/admin"
                      className="text-sm hover:text-primary relative inline-flex items-center gap-1"
                      title={
                        notifications.totalNotifications > 0
                          ? `계정승인: ${notifications.pendingUsers}명, 대여승인: ${notifications.pendingRentals}건, 반납승인: ${notifications.returnPendingRentals}건, 비밀번호재설정: ${notifications.passwordResetRequests}명`
                          : ''
                      }
                    >
                      관리자
                      {notifications.totalNotifications > 0 && (
                        <span className="flex items-center gap-1">
                          <Bell className="h-4 w-4 text-orange-500" />
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                            {notifications.totalNotifications}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            (계정:{notifications.pendingUsers} 대여:{notifications.pendingRentals} 반납:{notifications.returnPendingRentals} 비번:{notifications.passwordResetRequests})
                          </span>
                        </span>
                      )}
                    </Link>
                  </>
                )}
                <Link
                  href="/dashboard"
                  className="text-sm hover:text-primary relative inline-flex items-center gap-1"
                  title={
                    session.user.level === 'SUPER' && notifications.totalNotifications > 0
                      ? `대여승인: ${notifications.pendingRentals}건, 반납승인: ${notifications.returnPendingRentals}건`
                      : ''
                  }
                >
                  대시보드
                  {session.user.level === 'SUPER' && notifications.totalNotifications > 0 && (
                    <span className="flex items-center gap-1">
                      <Bell className="h-4 w-4 text-orange-500" />
                      <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {notifications.totalNotifications}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        (대여:{notifications.pendingRentals} 반납:{notifications.returnPendingRentals})
                      </span>
                    </span>
                  )}
                </Link>
                <Link href="/dashboard/change-password" className="text-sm hover:text-primary">
                  비밀번호 변경
                </Link>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  size="sm"
                >
                  로그아웃
                </Button>
              </>
            ) : (
              <div className="space-x-2">
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    회원가입
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}