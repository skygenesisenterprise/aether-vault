"use client";

import * as React from "react";
import { ConsoleShell } from '@/components/console/shell'
import { useAuth } from "@/context/AuthContext";
import { getDomainUrl } from "@/lib/domains";
import { RouteTransition } from "@/components/route-transition";

export default function ConsoleLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { isAuthenticated, isLoading } = useAuth();
  const isDev = process.env.NODE_ENV === "development";

  React.useEffect(() => {
    if (isLoading) return;

    // In development, allow access even without cross-subdomain session
    // since localStorage is not shared between sso/console subdomains.
    if (!isAuthenticated && !isDev) {
      window.location.href = getDomainUrl('sso', '/login');
    }
  }, [isAuthenticated, isLoading, isDev]);

  if (isLoading && !isDev) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <span>Vérification de la session…</span>
        </div>
      </div>
    );
  }

  return (
    <RouteTransition>
      <ConsoleShell>{children}</ConsoleShell>
    </RouteTransition>
  )
}
