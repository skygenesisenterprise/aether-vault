"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { usePathname, useRouter } from "@/i18n/navigation";
import { authApi } from "@/lib/api/auth";
import { getOAuthLoginUrl } from "@/lib/api/oauth";
import { saveSession, saveSessionPreferences } from "@/lib/api/session-persistence";
import { loginSchema, registerSchema } from "@/lib/auth/schemas";
import { cn } from "@/lib/utils";
import { getDomainUrl } from "@/lib/domains";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

type Mode = "login" | "register";

// Types pour les formulaires
interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  workspaceName?: string;
}

export function AuthForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const isRegister = mode === "register";

  // Initialisation des formulaires avec react-hook-form et zod
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      workspaceName: "",
    },
  });

  function getRedirectPath(user: { roles?: string[] } | null): string {
    if (redirectTo && redirectTo.startsWith("/")) {
      return redirectTo;
    }
    const adminRoles = ["admin", "superadmin", "owner"];
    const hasAdminRole = user?.roles?.some((role) => adminRoles.includes(role));
    if (hasAdminRole) {
      return "/dash";
    }
    return "/channels/me";
  }

  async function handleOAuthLogin(provider: "google" | "github" | "discord" | "apple") {
    try {
      const { url } = await getOAuthLoginUrl(provider, "login");
      window.location.href = url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start OAuth login";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (isRegister) {
        // Soumission du formulaire d'inscription
        const formData = registerForm.getValues();

        // Préparer le payload pour l'API
        const payload = {
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password,
          workspaceName: formData.workspaceName || undefined,
        };

        const response = await authApi.register(payload);

        if (response) {
          // Save session with persistence
          saveSession(
            response.accessToken,
            response.refreshToken ?? "",
            response.user,
            response.sessionId ?? `session-${Date.now()}`,
            response.expiresIn ?? 3600
          );

          toast({
            title: "Account created",
            description: "Your account has been created successfully.",
            variant: "default",
          });
          // After registration, redirect to the console domain.
          // The first account is considered admin by default.
          window.location.href = getDomainUrl("console", "/dash");
        }
      } else {
        // Soumission du formulaire de connexion
        const formData = loginForm.getValues();

        const payload = {
          email: formData.email,
          password: formData.password,
        };

        const response = await authApi.login(payload);

        if (response) {
          // Save session with persistence
          saveSession(
            response.accessToken,
            response.refreshToken ?? "",
            response.user,
            response.sessionId ?? `session-${Date.now()}`,
            response.expiresIn ?? 3600
          );
          saveSessionPreferences({ rememberMe });

          toast({
            title: "Welcome back",
            description: "You have been logged in successfully.",
            variant: "default",
          });
          const redirectPath = getRedirectPath(response.user);
          if (redirectPath === "/dash") {
            window.location.href = getDomainUrl("console", "/dash");
          } else {
            router.push(redirectPath);
          }
        }
      }
    } catch (error) {
      // Gestion des erreurs
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Mode toggle */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(["login", "register"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              mode === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {value === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isRegister
            ? "Start building with frontier AI in seconds."
            : "Sign in to continue to your workspace."}
        </p>
      </div>

      {/* Social auth */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-11"
          onClick={() => handleOAuthLogin("google")}
        >
          <GoogleIcon className="size-4" />
          Google
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-11"
          onClick={() => handleOAuthLogin("discord")}
        >
          <DiscordIcon className="size-4" />
          Discord
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-11"
          onClick={() => handleOAuthLogin("github")}
        >
          <GithubIcon className="size-4" />
          GitHub
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-11"
          onClick={() => handleOAuthLogin("apple")}
        >
          <AppleIcon className="size-4" />
          Apple
        </Button>
      </div>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {isRegister && (
          <Field
            id={nameId}
            label="Full name"
            icon={<User className="size-4" />}
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            required
            {...registerForm.register("displayName")}
            error={registerForm.formState.errors.displayName?.message}
          />
        )}

        <Field
          id={emailId}
          label="Email"
          icon={<Mail className="size-4" />}
          type="email"
          autoComplete="email"
          placeholder="john.doe@company.com"
          required
          {...(isRegister ? registerForm.register("email") : loginForm.register("email"))}
          error={
            isRegister
              ? registerForm.formState.errors.email?.message
              : loginForm.formState.errors.email?.message
          }
        />

        {!isRegister && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            <span>Remember me</span>
          </label>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor={passwordId} className="text-sm font-medium text-foreground">
              Password
            </label>
            {!isRegister && (
              <button type="button" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Lock className="size-4" />
            </span>
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="••••••••"
              required
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-10 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
              {...(isRegister ? registerForm.register("password") : loginForm.register("password"))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {isRegister && (
            <p className="mt-1.5 text-xs text-muted-foreground">Must be at least 12 characters.</p>
          )}
          {isRegister
            ? registerForm.formState.errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {registerForm.formState.errors.password.message}
                </p>
              )
            : loginForm.formState.errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
        </div>

        {isRegister && (
          <Field
            id={confirmPasswordId}
            label="Confirm password"
            icon={<Lock className="size-4" />}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            required
            {...registerForm.register("confirmPassword")}
            error={registerForm.formState.errors.confirmPassword?.message}
          />
        )}

        {isRegister && (
          <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              required
              className="mt-0.5 size-4 rounded border-input accent-primary"
            />
            <span>
              I agree to the{" "}
              <a href="#" className="font-medium text-primary hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="font-medium text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
        )}

        <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full text-sm">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(isRegister ? "login" : "register")}
          className="font-medium text-primary hover:underline"
        >
          {isRegister ? "Sign in" : "Create one"}
        </button>
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  ...props
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <input
          id={id}
          className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1C5.92 1 1 5.92 1 12c0 4.86 3.15 8.98 7.52 10.44.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.47-3.71-1.47-.5-1.28-1.22-1.62-1.22-1.62-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.2.92.1-.71.38-1.2.7-1.47-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .92-.3 3.02 1.13a10.5 10.5 0 0 1 5.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.23-2.58 5.15-5.03 5.43.39.34.74 1.01.74 2.04v3.03c0 .29.2.64.76.53A11.01 11.01 0 0 0 23 12c0-6.08-4.92-11-11-11Z"
      />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}
