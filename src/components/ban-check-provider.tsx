'use client'

import { useBanCheck } from '@/hooks/use-ban-check'

export function BanCheckProvider({ children }: { children: React.ReactNode }) {
  useBanCheck()
  return <>{children}</>
}