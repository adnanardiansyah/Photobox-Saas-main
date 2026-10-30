import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, apiError } from '@/lib/api-security'
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request)
    return NextResponse.json({ success: true, authenticated: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId } })
  } catch (error) { return apiError(error) }
}
