import * as React from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { AuthGuard } from "./AuthGuard";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages({ locale: routing.defaultLocale });

  return (
    <NextIntlClientProvider
      locale={routing.defaultLocale}
      messages={messages}
    >
      <AuthGuard>{children}</AuthGuard>
    </NextIntlClientProvider>
  );
}
