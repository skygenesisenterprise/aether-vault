import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "./apps/i18n/routing";

const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

type Locale = (typeof routing.locales)[number];

/* -------------------------------------------------------------------------- *
 * Domain ↔ route group mapping
 * -------------------------------------------------------------------------- */

type DomainGroup = "sso" | "console" | "main";

const SSO_HOSTS = ["sso.guilderia.com", "sso.guilderia.lan"];
const CONSOLE_HOSTS = ["console.guilderia.com", "console.guilderia.lan"];
const MAIN_HOSTS = ["guilderia.com", "guilderia.lan", "guilderia.com", "www.guilderia.com"];

const AUTH_PATHS = [
  "/login",
  "/register",
  "/profile-change",
  "/mfa-validate",
  "/mfa-setup",
  "/mfa-verify",
  "/mfa-recovery",
  "/mfa-recovery-setup",
  "/mfa-recovery-verify",
];
const PLATFORM_PATHS = ["/dash"];

function detectGroup(host: string): DomainGroup {
  const hostname = host.split(":")[0];
  if (SSO_HOSTS.includes(hostname)) return "sso";
  if (CONSOLE_HOSTS.includes(hostname)) return "console";
  return "main";
}

function getDomainForGroup(group: DomainGroup, currentUrl: URL): string {
  const hostname = currentUrl.hostname;
  const protocol = currentUrl.protocol;

  if (IS_DEVELOPMENT) {
    switch (group) {
      case "sso":
        return `${protocol}//sso.guilderia.localhost`;
      case "console":
        return `${protocol}//console.guilderia.localhost`;
      case "main":
        return `${protocol}//guilderia.localhost`;
    }
  }

  switch (group) {
    case "sso":
      return `${protocol}//sso.kami-sama.tv`;
    case "console":
      return `${protocol}//console.kami-sama.tv`;
    case "main":
      return `${protocol}//${hostname}`;
  }
}

function belongsToGroup(pathname: string, group: DomainGroup): boolean {
  switch (group) {
    case "sso":
      return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
    case "console":
      return PLATFORM_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
    case "main":
      return true;
  }
}

function getTargetGroup(pathname: string): DomainGroup | null {
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "sso";
  if (PLATFORM_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "console";
  return null;
}

/* -------------------------------------------------------------------------- *
 * Locale helpers
 * -------------------------------------------------------------------------- */

const countryToLocale: Record<string, Locale> = { FR: "fr", EN: "en" };

function getCountryFromRequest(request: NextRequest): string | null {
  return (
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("x-fastly-geo-country") ||
    null
  );
}

function getLocaleFromCountry(country: string | null): Locale {
  if (country && country in countryToLocale) return countryToLocale[country];
  return routing.defaultLocale;
}

function isValidLocale(segment: string): segment is Locale {
  return routing.locales.includes(segment as Locale);
}

/* -------------------------------------------------------------------------- *
 * Auth helpers
 * -------------------------------------------------------------------------- */

const REFRESH_COOKIE = "guilderia_refresh";
const ACCESS_TOKEN_COOKIE = "guilderia_access_token";

function isAuthCookiePresent(request: NextRequest): boolean {
  const refresh = request.cookies.get(REFRESH_COOKIE);
  const access = request.cookies.get(ACCESS_TOKEN_COOKIE);
  return Boolean(
    (refresh?.value && refresh.value.length > 0) || (access?.value && access.value.length > 0)
  );
}

function getAccessToken(request: NextRequest): string | null {
  return request.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

function hasAdminAccess(request: NextRequest): boolean {
  try {
    const token = getAccessToken(request);
    if (!token) return false;
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    const roles: string[] = payload.roles || [];
    return roles.includes("admin") || roles.includes("superadmin") || roles.includes("owner");
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- *
 * Middleware entry
 * -------------------------------------------------------------------------- */

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || request.nextUrl.hostname;
  const currentGroup = detectGroup(host);

  /* ---- Root path ---- */
  if (pathname === "/" || pathname === "") {
    switch (currentGroup) {
      case "sso":
        return NextResponse.redirect(new URL("/login", request.url));
      case "console":
        return NextResponse.redirect(new URL("/dash", request.url));
      case "main":
      default: {
        if (isAuthCookiePresent(request)) {
          return NextResponse.redirect(new URL("/profile-change", request.url));
        }
        const locale = getLocaleFromCountry(getCountryFromRequest(request));
        return NextResponse.redirect(new URL(`/${locale}/discover`, request.url));
      }
    }
  }

  /* ---- Cross-domain routing ---- */
  const targetGroup = getTargetGroup(pathname);
  if (targetGroup && targetGroup !== currentGroup) {
    return NextResponse.redirect(
      new URL(pathname, getDomainForGroup(targetGroup, request.nextUrl))
    );
  }

  /* ---- SSO domain: only auth routes ---- */
  if (currentGroup === "sso") {
    return NextResponse.next();
  }

  /* ---- Console domain: only platform routes ---- */
  if (currentGroup === "console") {
    if (PLATFORM_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      if (IS_DEVELOPMENT) return NextResponse.next();
      if (isAuthCookiePresent(request) && hasAdminAccess(request)) return NextResponse.next();
      return NextResponse.redirect(new URL("/dash", request.url));
    }
    return NextResponse.redirect(new URL("/dash", request.url));
  }

  /* ---- Main domain: public routes ---- */
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isValidLocale(firstSegment)) {
    const localePath = `/${firstSegment}`;
    if (
      AUTH_PATHS.some((p) => pathname.startsWith(localePath + p) || pathname === localePath + p)
    ) {
      const cleanPath = pathname.replace(localePath, "");
      return NextResponse.redirect(new URL(cleanPath || "/", request.url));
    }
    if (
      PLATFORM_PATHS.some((p) => pathname.startsWith(localePath + p) || pathname === localePath + p)
    ) {
      const cleanPath = pathname.replace(localePath, "");
      return NextResponse.redirect(new URL(cleanPath || "/", request.url));
    }
    return NextResponse.next();
  }

  if (firstSegment && !isValidLocale(firstSegment)) {
    if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }
    if (PLATFORM_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }
    const locale = getLocaleFromCountry(getCountryFromRequest(request));
    // Preserve the original query string (e.g. `?ep=<episodeId>` on watch
    // links) — `new URL(path, base)` would silently drop it, sending users
    // to the wrong episode after the locale redirect.
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|health).*)"],
};
