'use client'
import type { ReactNode } from 'react'
import { useDashboardStore } from '@/lib/stores/dashboard-store'
export function useCanManage() {
  return useDashboardStore((state) =>
    ['OWNER', 'SUPER_ADMIN'].includes(state.currentUser?.role || '')
  )
}
export function WriteAccess({ children }: { children: ReactNode }) {
  const allowed = useCanManage()
  return allowed ? <>{children}</> : null
}
