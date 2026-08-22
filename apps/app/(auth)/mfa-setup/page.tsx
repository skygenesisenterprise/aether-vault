'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Loader2,
  Shield,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  ArrowLeft,
  KeyRound,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { getDomainUrl } from '@/lib/domains'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'

type SetupStep = 'init' | 'scan' | 'verify' | 'recovery' | 'complete'

interface MfaSetupData {
  secret: string
  otpauthUrl: string
  qrCodeUrl: string
  recoveryCodes: string[]
}

export default function MfaSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [step, setStep] = useState<SetupStep>('init')
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [allCodesCopied, setAllCodesCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const startSetup = useCallback(async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // TODO: Replace with actual API call: POST /auth/mfa/setup
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mock response - in production, this comes from the server
      const mockSetupData: MfaSetupData = {
        secret: 'JBSWY3DPEHPK3PXP',
        otpauthUrl:
          'otpauth://totp/etheriatimes:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=The Etheria Times',
        qrCodeUrl: '',
        recoveryCodes: [
          'a1b2-c3d4-e5f6',
          'g7h8-i9j0-k1l2',
          'm3n4-o5p6-q7r8',
          's9t0-u1v2-w3x4',
          'y5z6-a7b8-c9d0',
          'e1f2-g3h4-i5j6',
          'k7l8-m9n0-o1p2',
          'q3r4-s5t6-u7v8',
        ],
      }

      // Generate QR code URL using a QR code API
      const qrData = encodeURIComponent(mockSetupData.otpauthUrl)
      mockSetupData.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`

      setSetupData(mockSetupData)
      setStep('scan')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize MFA setup'
      setError(message)
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const handleVerifyCode = useCallback(async () => {
    if (verificationCode.length !== 6) return

    setIsSubmitting(true)
    setError(null)

    try {
      // TODO: Replace with actual API call: POST /auth/mfa/verify-setup
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock verification - in production, server validates the TOTP code
      // For demo, accept any 6-digit code
      setStep('recovery')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Code invalide. Réessayez.'
      setError(message)
      toast({
        title: 'Erreur de vérification',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [verificationCode])

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true)

    try {
      // TODO: Replace with actual API call: POST /auth/mfa/confirm-setup
      await new Promise((resolve) => setTimeout(resolve, 500))

      setStep('complete')
      toast({
        title: 'Authentification à deux facteurs activée',
        description: 'Votre compte est maintenant protégé par MFA.',
        variant: 'default',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete setup'
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(text)
      setTimeout(() => setCopiedCode(null), 2000)
      toast({
        title: 'Copié',
        description: 'Code copié dans le presse-papier.',
        variant: 'default',
      })
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le code.',
        variant: 'destructive',
      })
    }
  }, [])

  const copyAllRecoveryCodes = useCallback(async () => {
    if (!setupData) return
    const allCodes = setupData.recoveryCodes.join('\n')
    await copyToClipboard(allCodes)
    setAllCodesCopied(true)
    setTimeout(() => setAllCodesCopied(false), 3000)
  }, [setupData, copyToClipboard])

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
          {/* Step: Init */}
          {step === 'init' && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="size-8 text-primary" />
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                Sécuriser votre compte
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajoutez une couche de sécurité supplémentaire avec
                l&apos;authentification à deux facteurs (MFA).
              </p>

              <div className="mt-6 rounded-xl border border-border/40 bg-card/50 p-4 text-left">
                <h3 className="text-sm font-medium">Comment ça marche ?</h3>
                <ul className="mt-3 space-y-2.5">
                  {[
                    {
                      icon: <Smartphone className="size-4" />,
                      text: 'Installez une application d\'authentification (Google Authenticator, Authy, etc.)',
                    },
                    {
                      icon: <KeyRound className="size-4" />,
                      text: 'Scannez le QR code ou saisissez la clé secrète',
                    },
                    {
                      icon: <ShieldCheck className="size-4" />,
                      text: 'Saisissez le code de vérification pour activer la MFA',
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                        {item.icon}
                      </span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={startSetup}
                disabled={isSubmitting}
                className="mt-6 h-11 w-full text-sm"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Commencer la configuration
              </Button>

              <button
                type="button"
                onClick={() => router.back()}
                className="mt-4 flex items-center gap-1.5 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
                Retour
              </button>
            </div>
          )}

          {/* Step: Scan QR Code */}
          {step === 'scan' && setupData && (
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                Scanner le QR code
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ouvrez votre application d&apos;authentification et scannez
                le code ci-dessous.
              </p>

              {/* QR Code */}
              <div className="mt-6 flex justify-center">
                <div className="rounded-xl border border-border/40 bg-card/50 p-4">
                  {setupData.qrCodeUrl ? (
                    <img
                      src={setupData.qrCodeUrl}
                      alt="QR Code pour configuration MFA"
                      className="size-50 rounded-lg"
                    />
                  ) : (
                    <div className="flex size-50 items-center justify-center rounded-lg bg-muted">
                      <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Manual entry option */}
              <div className="mt-6">
                <p className="text-xs text-muted-foreground">
                  Ou entrez la clé manuellement :
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <code className="rounded-lg border border-border/40 bg-muted px-3 py-2 font-mono text-sm tracking-wider">
                    {setupData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(setupData.secret)}
                    className="flex size-8 items-center justify-center rounded-lg border border-border/40 bg-card/50 transition-colors hover:bg-card"
                    aria-label="Copier la clé secrète"
                  >
                    {copiedCode === setupData.secret ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={() => setStep('verify')}
                className="mt-6 h-11 w-full text-sm"
              >
                Continuer
              </Button>

              <button
                type="button"
                onClick={() => setStep('init')}
                className="mt-4 flex items-center gap-1.5 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
                Retour
              </button>
            </div>
          )}

          {/* Step: Verify Code */}
          {step === 'verify' && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <KeyRound className="size-8 text-primary" />
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                Vérifier le code
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Saisissez le code à 6 chiffres affiché dans votre
                application d&apos;authentification.
              </p>

              {/* OTP Input */}
              <div className="mt-8 flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  disabled={isSubmitting}
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

              <Button
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6 || isSubmitting}
                className="mt-6 h-11 w-full text-sm"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Vérifier et activer
              </Button>

              <button
                type="button"
                onClick={() => setStep('scan')}
                className="mt-4 flex items-center gap-1.5 mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
                Retour au QR code
              </button>
            </div>
          )}

          {/* Step: Recovery Codes */}
          {step === 'recovery' && setupData && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-amber-500/10">
                <AlertTriangle className="size-8 text-amber-500" />
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                Codes de récupération
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Conservez ces codes en lieu sûr. Vous pourrez les utiliser
                pour accéder à votre compte si vous perdez l&apos;accès à
                votre application d&apos;authentification.
              </p>

              {/* Warning */}
              <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Chaque code ne peut être utilisé qu&apos;une seule fois.
                  Conservez-les dans un endroit sûr.
                </p>
              </div>

              {/* Recovery codes grid */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {setupData.recoveryCodes.map((code, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 px-3 py-2"
                  >
                    <code className="font-mono text-sm">{code}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(code)}
                      className="ml-2 flex size-6 items-center justify-center rounded transition-colors hover:bg-muted"
                      aria-label={`Copier le code ${code}`}
                    >
                      {copiedCode === code ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Copy all button */}
              <Button
                variant="outline"
                onClick={copyAllRecoveryCodes}
                className="mt-4 h-10 w-full text-sm"
              >
                {allCodesCopied ? (
                  <>
                    <Check className="size-4" />
                    Tous les codes copiés
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copier tous les codes
                  </>
                )}
              </Button>

              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="mt-4 h-11 w-full text-sm"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                J&apos;ai sauvegardé mes codes
              </Button>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-green-500/10">
                <ShieldCheck className="size-8 text-green-500" />
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                MFA activée !
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                L&apos;authentification à deux facteurs est maintenant
                activée sur votre compte. Vous serez invité à saisir un
                code lors de chaque connexion.
              </p>

              <Button
                onClick={() => window.location.href = getDomainUrl('main', '/fr')}
                className="mt-8 h-11 w-full text-sm"
              >
                Continuer vers l&apos;application
              </Button>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} The Etheria Times. All rights reserved.
      </footer>
    </main>
  )
}
