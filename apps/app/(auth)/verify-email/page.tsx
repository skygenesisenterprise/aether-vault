'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MailCheck,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'

const RESEND_COOLDOWN_SECONDS = 60
const MAX_ATTEMPTS = 5
const LOCK_SECONDS = 30

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  if (local.length <= 2) return `${local[0]}${'•'.repeat(local.length - 1)}@${domain}`
  return `${local.slice(0, 2)}${'•'.repeat(Math.min(local.length - 2, 4))}@${domain}`
}

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const email = searchParams.get('email') || 'u•••@etheriatimes.com'
  const redirect = (searchParams.get('redirect') || 'fr').replace(/^\/+/, '')

  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const [verified, setVerified] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(interval)
  }, [cooldown])

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

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isResending) return

    setIsResending(true)
    try {
      // TODO: Replace with actual API call: POST /auth/resend-verification
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCooldown(RESEND_COOLDOWN_SECONDS)
      toast({
        title: 'Code renvoyé',
        description: `Un nouveau code a été envoyé à ${email}.`,
        variant: 'default',
      })
    } catch {
      toast({
        title: 'Échec de l’envoi',
        description: 'Impossible de renvoyer le code. Réessayez dans quelques instants.',
        variant: 'destructive',
      })
    } finally {
      setIsResending(false)
    }
  }, [cooldown, isResending, email])

  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || isLocked) return

    setIsSubmitting(true)
    setError(null)

    try {
      // TODO: Replace with actual API call: POST /auth/verify-email
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock validation — in production, the server validates the email code
      if (code === '000000') {
        throw new Error('Code invalide. Veuillez vérifier votre email et réessayer.')
      }

      setVerified(true)
      toast({
        title: 'Email vérifié',
        description: 'Votre adresse email a été vérifiée avec succès.',
        variant: 'default',
      })

      setTimeout(() => {
        router.replace(`/${redirect}`)
      }, 1200)
    } catch (err) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      const message = err instanceof Error ? err.message : 'Code invalide. Réessayez.'
      setError(message)

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true)
        setLockTimer(LOCK_SECONDS)
        setError(`Trop de tentatives. Veuillez patienter ${LOCK_SECONDS} secondes.`)
        toast({
          title: 'Compte temporairement bloqué',
          description: `Trop de tentatives incorrectes. Réessayez dans ${LOCK_SECONDS} secondes.`,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Code invalide',
          description: `${MAX_ATTEMPTS - newAttempts} tentative(s) restante(s) avant le blocage.`,
          variant: 'destructive',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [code, isLocked, attempts, router, redirect])

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <main className="flex min-h-screen flex-col px-6 py-8 sm:px-10">
      <header className="flex items-center gap-2.5">
        <span className="text-lg font-semibold tracking-tight">The Etheria Times</span>
      </header>

      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <div
              className={`mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors ${
                verified ? 'bg-emerald-500/10' : ''
              }`}
            >
              {verified ? (
                <CheckCircle2 className="size-8 text-emerald-500" />
              ) : (
                <MailCheck className="size-8 text-primary" />
              )}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {verified ? 'Email vérifié' : 'Vérifiez votre email'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {verified
                ? 'Votre adresse email a été vérifiée avec succès.'
                : `Nous avons envoyé un code à 6 chiffres à `}
              {!verified && (
                <span className="font-medium text-foreground">{maskEmail(email)}</span>
              )}
            </p>
          </div>

          {verified ? (
            /* Success state */
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous allez être redirigé vers la plateforme…
                </p>
              </div>
              <Button
                onClick={() => router.replace(`/${redirect}`)}
                className="h-11 w-full text-sm"
              >
                Continuer
              </Button>
            </div>
          ) : (
            <>
              {/* Code input */}
              <div>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => {
                      setCode(value)
                      setError(null)
                    }}
                    disabled={isSubmitting || isLocked}
                    onComplete={(value) => {
                      setCode(value)
                      if (value.length === 6 && !isLocked) {
                        setTimeout(() => handleVerify(), 100)
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
                    Blocage temporaire : {formatTime(lockTimer)}
                  </div>
                )}

                <Button
                  onClick={handleVerify}
                  disabled={code.length !== 6 || isSubmitting || isLocked}
                  className="mt-6 h-11 w-full text-sm"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Vérifier mon email
                </Button>
              </div>

              {/* Resend */}
              <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-center text-xs text-muted-foreground">
                  Vous n&apos;avez pas reçu le code ?
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending || isLocked}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  {isResending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : cooldown > 0 ? (
                    <Clock className="size-4" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {cooldown > 0
                    ? `Renvoyer le code (${formatTime(cooldown)})`
                    : 'Renvoyer le code'}
                </Button>
              </div>
            </>
          )}

          {/* Footer actions */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Retour à la connexion
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Problème avec votre code ?{' '}
              <button
                type="button"
                onClick={() => {
                  toast({
                    title: 'Contactez le support',
                    description:
                      'Envoyez un email à support@etheriatimes.com pour obtenir de l’aide.',
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
