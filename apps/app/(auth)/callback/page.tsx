'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { authApi } from '@/lib/api/auth'
import { getDomainUrl } from '@/lib/domains'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (error) {
      router.push('/login?error=' + encodeURIComponent(error))
      return
    }

    const bootstrap = async () => {
      try {
        await authApi.bootstrap()
        window.location.href = getDomainUrl('console', '/dash')
      } catch {
        router.push('/login')
      }
    }

    bootstrap()
  }, [error, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
