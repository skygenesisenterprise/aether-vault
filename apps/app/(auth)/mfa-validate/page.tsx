'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Loader2,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { getDomainUrl } from '@/lib/domains'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'

type ValidateMode = 'otp' | 'recovery'

export default function MfaValidatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [mode, setMode] = useState<ValidateMode>('otp')
  const [otpCode, setOtpCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)

  // Lock timer countdown
  useEffect(() => {
    if (!isLocked || lockTimer <= 0) return

    const interval = setInterval(() => {
      setLockTimer((prev) => {
        if (prev <= 1) {
          setIsLocked(false)
          setAttempts(0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isLocked, lockTimer])

  const handleVerifyOTP = useCallback(async () => {
    if (otpCode.length !== 6 || isLocked) return

    setIsSubmitting(true)
    setError(null)

    try {
      // TODO: Replace with actual API call: POST /auth/mfa/validate
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock validation - in production, server validates the TOTP code
      // For demo, reject specific codes to show error handling
      if (otpCode === '000000') {
        throw new Error('Code invalide. Veuillez réessayer.')
      }

      toast({
        title: 'Authentification réussie',
        description: 'Bienvenue ! Vous êtes maintenant connecté.',
        variant: 'default',
      })

      // Redirect to the intended destination
      const redirect = searchParams.get('redirect') || '/fr'
      window.location.href = redirect.startsWith('http') ? redirect : getDomainUrl('main', redirect)
    } catch (err) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      const message = err instanceof Error ? err.message : 'Code invalide. Réessayez.'
      setError(message)

      // Lock after 5 failed attempts
      if (newAttempts >= 5) {
        setIsLocked(true)
        setLockTimer(30)
        setError('Trop de tentatives. Veuillez patienter 30 secondes.')
        toast({
          title: 'Compte temporairement bloqué',
          description: 'Trop de tentatives incorrectes. Réessayez dans 30 secondes.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Code invalide',
          description: `${5 - newAttempts} tentative(s) restante(s) avant le blocage.`,
          variant: 'destructive',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [otpCode, isLocked, attempts, searchParams, router])

  const handleVerifyRecovery = useCallback(async () => {
    if (!recoveryCode.trim() || isLocked) return

    setIsSubmitting(true)
    setError(null)

    try {
      // TODO: Replace with actual API call: POST /auth/mfa/validate-recovery
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock validation - in production, server validates the recovery code
      // For demo, reject codes that don't match pattern
      if (!/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/i.test(recoveryCode.trim())) {
        throw new Error('Format de code invalide. Utilisez le format XXXX-XXXX-XXXX.')
      }

      toast({
        title: 'Authentification réussie',
        description: 'Code de récupération utilisé. Pensez à en régénérer.',
        variant: 'default',
      })

      // Redirect to the intended destination
      const redirect = searchParams.get('redirect') || '/fr'
      window.location.href = redirect.startsWith('http') ? redirect : getDomainUrl('main', redirect)
    } catch (err) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      const message = err instanceof Error ? err.message : 'Code de récupération invalide.'
      setError(message)

      // Lock after 3 failed attempts for recovery codes
      if (newAttempts >= 3) {
        setIsLocked(true)
        setLockTimer(60)
        setError('Trop de tentatives. Veuillez patienter 60 secondes.')
        toast({
          title: 'Compte temporairement bloqué',
          description: 'Trop de tentatives incorrectes. Réessayez dans 60 secondes.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [recoveryCode, isLocked, attempts, searchParams, router])

  // Redirect if not authenticated (MFA is a second step after password)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // MFA validation requires an active session (partial auth)
      // If no session, redirect to login
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-8 sm:px-10">
      <header className="flex items-center gap-2.5">
        <span className="text-lg font-semibold tracking-tight">The Etheria Times</span>
      </header>

      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="size-8 text-primary" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Vérification requise
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'otp'
                ? 'Saisissez le code à 6 chiffres de votre application d\'authentification.'
                : 'Entrez un de vos codes de récupération.'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setMode('otp')
                setError(null)
              }}
              disabled={isLocked}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                mode === 'otp'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KeyRound className="size-4" />
              Code OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('recovery')
                setError(null)
              }}
              disabled={isLocked}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                mode === 'recovery'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <RefreshCw className="size-4" />
              Récupération
            </button>
          </div>

          {/* OTP Mode */}
          {mode === 'otp' && (
            <div>
              {/* OTP Input */}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => {
                    setOtpCode(value)
                    setError(null)
                  }}
                  disabled={isSubmitting || isLocked}
                  onComplete={(value) => {
                    setOtpCode(value)
                    // Auto-submit when complete
                    if (value.length === 6 && !isLocked) {
                      setTimeout(() => handleVerifyOTP(), 100)
                    }
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {isLocked && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-card/50 p-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Blocage temporaire : {lockTimer}s
                </div>
              )}

              <Button
                onClick={handleVerifyOTP}
                disabled={otpCode.length !== 6 || isSubmitting || isLocked}
                className="mt-6 h-11 w-full text-sm"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Vérifier
              </Button>
            </div>
          )}

          {/* Recovery Mode */}
          {mode === 'recovery' && (
            <div>
              <div>
                <label
                  htmlFor="recovery-code"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Code de récupération
                </label>
                <Input
                  id="recovery-code"
                  type="text"
                  placeholder="XXXX-XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(e) => {
                    setRecoveryCode(e.target.value)
                    setError(null)
                  }}
                  disabled={isSubmitting || isLocked}
                  className="h-11 w-full text-center font-mono text-sm tracking-wider"
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Format : quatre caractères, tiret, quatre caractères, tiret, quatre caractères
                </p>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {isLocked && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-card/50 p-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Blocage temporaire : {lockTimer}s
                </div>
              )}

              <Button
                onClick={handleVerifyRecovery}
                disabled={!recoveryCode.trim() || isSubmitting || isLocked}
                className="mt-6 h-11 w-full text-sm"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Utiliser le code de récupération
              </Button>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex items-center gap-1.5 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              Retour à la connexion
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Problème d&apos;accès ?{' '}
              <button
                type="button"
                onClick={() => {
                  toast({
                    title: 'Contactez le support',
                    description:
                      'Envoyez un email à support@etheriatimes.com pour obtenir de l\'aide.',
                    variant: 'default',
                  })
                }}
                className="font-medium text-primary hover:underline"
              >
                Contactez le support
              </button>
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} The Etheria Times. All rights reserved.
      </footer>
    </main>
  )
}
