'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { routing } from '@/i18n/routing'

export default function RootPage() {
  const router = useRouter()
  const { isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    router.replace(`/${routing.defaultLocale}`)
  }, [isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Chargement…
    </div>
  )
}
