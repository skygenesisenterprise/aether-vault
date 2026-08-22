'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { getStoredUser, refreshAccessToken } from '@/lib/api/auth'

/**
 * CLI SSO callback page.
 *
 * Flow:
 *  1. `Etheria Times sso` starts a local HTTP server on port PORT
 *  2. Opens browser to this page: /cli-auth?port=PORT&state=RANDOM
 *  3. If user is already logged in (session cookie), we post the token back
 *  4. If not, redirect to /login with a redirect back to this page
 */
export default function CliAuthPage() {
  const searchParams = useSearchParams()
  const port = searchParams.get('port')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Authenticating CLI...')

  useEffect(() => {
    if (!port || !state) {
      setStatus('error')
      setMessage('Missing required parameters (port, state)')
      return
    }

    if (error) {
      setStatus('error')
      setMessage(error)
      return
    }

    let cancelled = false

    const authenticate = async () => {
      // Try to get a valid access token via refresh
      const token = await refreshAccessToken(5_000)

      if (cancelled) return

      if (!token) {
        // Not logged in — redirect to login, then back here
        const returnUrl = encodeURIComponent(`/cli-auth?port=${port}&state=${state}`)
        window.location.href = `/login?redirect=${returnUrl}`
        return
      }

      // User is logged in — post token back to CLI
      try {
        const user = getStoredUser()
        const callbackRes = await fetch(`http://127.0.0.1:${port}/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            state,
            user,
          }),
        })

        if (callbackRes.ok) {
          setStatus('success')
          setMessage('Authenticated! You can close this tab.')
        } else {
          setStatus('error')
          setMessage('Failed to send token to CLI')
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(`Connection failed: ${err.message}`)
      }
    }

    authenticate()

    return () => {
      cancelled = true
    }
  }, [port, state, error])

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="size-8 text-green-500" />
            <p className="text-sm text-green-600">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="size-8 text-red-500" />
            <p className="text-sm text-red-600">{message}</p>
            <p className="text-xs text-muted-foreground">You can close this tab.</p>
          </>
        )}
      </div>
    </div>
  )
}
