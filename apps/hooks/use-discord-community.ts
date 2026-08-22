'use client'

import * as React from 'react'

import {
  discordCommunityMock,
  type DiscordCommunityData,
  type DiscordIntegration,
  type DiscordConnectionState,
} from '@/lib/discord-data'

export type CommunityStatus =
  | 'loading'
  | DiscordConnectionState

export interface UseDiscordCommunityReturn {
  data: DiscordCommunityData | null
  status: CommunityStatus
  /** Simulate (re)connecting Discord — swap for a real OAuth flow. */
  connect: () => void
  /** Re-run the fetch — swap for a real API call. */
  retry: () => void
  /** Toggle an integration module locally. */
  toggleIntegration: (id: string, enabled: boolean) => void
}

const MOCK_DELAY_MS = 900

/**
 * Loads the Discord community data for the dashboard.
 *
 * Today this resolves against local mock data; tomorrow it can resolve
 * against `GET /discord/community` without touching the UI.
 */
export function useDiscordCommunity(): UseDiscordCommunityReturn {
  const [status, setStatus] = React.useState<CommunityStatus>('loading')
  const [data, setData] = React.useState<DiscordCommunityData | null>(null)

  const load = React.useCallback((delay = MOCK_DELAY_MS) => {
    setStatus('loading')
    setData(null)
    const timer = window.setTimeout(() => {
      setData(discordCommunityMock)
      setStatus(discordCommunityMock.connectionState)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [])

  React.useEffect(() => load(), [load])

  const connect = React.useCallback(() => {
    setStatus('loading')
    const timer = window.setTimeout(() => {
      setData((prev) =>
        prev ? { ...prev, connectionState: 'connected' } : discordCommunityMock,
      )
      setStatus('connected')
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [])

  const retry = React.useCallback(() => {
    load()
  }, [load])

  const toggleIntegration = React.useCallback((id: string, enabled: boolean) => {
    setData((prev) => {
      if (!prev) return prev
      const integrations: DiscordIntegration[] = prev.integrations.map((i) =>
        i.id === id ? { ...i, state: enabled ? 'enabled' : 'disabled' } : i,
      )
      return { ...prev, integrations }
    })
  }, [])

  return { data, status, connect, retry, toggleIntegration }
}
