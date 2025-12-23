'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useBanCheck() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/banned' || pathname === '/login' || pathname === '/event-code' || pathname === '/' || pathname === '/unauthorized' || pathname.startsWith('/api/')) {
      return
    }

    const checkBanStatus = async () => {
      try {
        const response = await fetch('/api/auth/check-ban')
        if (response.ok) {
          const data = await response.json()
          if (data.banned) {
            router.push(`/banned?reason=${encodeURIComponent(data.reason || 'You have been banned from this event.')}`)
          }
        }
      } catch (error) {
        console.error('Error checking ban status:', error)
      }
    }

    checkBanStatus()

    const interval = setInterval(checkBanStatus, 30000)

    return () => clearInterval(interval)
  }, [router, pathname])
}