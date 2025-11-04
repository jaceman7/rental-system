import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { approved, role, level, passwordResetRequested, passwordResetRequestedAt } = body

    const updateData: any = {}

    if (typeof approved === 'boolean') {
      updateData.approved = approved
    }
    if (role) {
      updateData.role = role
    }
    if (level) {
      updateData.level = level
    }
    if (typeof passwordResetRequested === 'boolean') {
      updateData.passwordResetRequested = passwordResetRequested
    }
    if (passwordResetRequestedAt !== undefined) {
      updateData.passwordResetRequestedAt = passwordResetRequestedAt
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        level: true,
        approved: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: '사용자 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 관리자 자신을 삭제하지 못하도록 방지
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: '자신의 계정은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: '사용자가 삭제되었습니다.' })
  } catch (error) {
    console.error('User delete error:', error)
    return NextResponse.json(
      { error: '사용자 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}