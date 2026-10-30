import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkOrigin, apiError } from '@/lib/api-security'
import { rateLimit } from '@/lib/rate-limit'
import { verifyPassword, signAuthToken, getAuthCookieName } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request)
    rateLimit(request, 'admin-login', 10, 15 * 60000)
    const body = await request.json()
    const { email, password } = body

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 256) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        passwordHash: true,
        isActive: true,
        tenant: { select: { isActive: true } },
      },
    })

    if (!user || !user.isActive || !user.tenant.isActive || !['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    })

    response.cookies.set(getAuthCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    return apiError(error)
  }
}
