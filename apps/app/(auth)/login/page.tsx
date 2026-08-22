import { AuthForm } from '@/components/auth/auth-form'

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col px-6 py-4 sm:px-10 sm:py-5 lg:h-screen lg:overflow-hidden">
      <header className="flex items-center gap-2.5">
        <span className="text-lg font-semibold tracking-tight">Guilderia</span>
      </header>

      <div className="flex flex-1 items-center justify-center py-4 lg:min-h-0">
        <AuthForm />
      </div>

      <footer className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Guilderia. All rights reserved.
      </footer>
    </main>
  )
}
