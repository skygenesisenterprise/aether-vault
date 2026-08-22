export type Environment = 'production' | 'localhost'

export interface DomainConfig {
  main: string
  console: string
  sso: string
  protocol: string
}

const DOMAINS: Record<Environment, DomainConfig> = {
  production: {
    main: 'guilderia.com',
    console: 'console.guilderia.com',
    sso: 'sso.guilderia.com',
    protocol: 'https',
  },
  localhost: {
    main: 'guilderia.localhost',
    console: 'console.guilderia.localhost',
    sso: 'sso.guilderia.localhost',
    protocol: 'http',
  },
}

export function detectEnvironment(): Environment {
  if (typeof window === 'undefined') return 'production'
  return window.location.hostname.includes('localhost') ? 'localhost' : 'production'
}

export function getDomainConfig(): DomainConfig {
  return DOMAINS[detectEnvironment()]
}

export function getDomainUrl(service: 'main' | 'console' | 'sso', path: string = ''): string {
  const config = getDomainConfig()
  return `${config.protocol}://${config[service]}${path}`
}

export function switchDomain(target: 'main' | 'console' | 'sso', path: string): string {
  return getDomainUrl(target, path)
}
