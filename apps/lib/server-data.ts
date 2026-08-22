export interface Server {
  id: string
  name: string
  icon: string | null
  acronym: string
  unread?: boolean
  mentions?: number
}

export interface Channel {
  id: string
  name: string
  type: 'text' | 'voice'
  unread?: boolean
}

export interface ChannelCategory {
  id: string
  name: string
  channels: Channel[]
}

export const mockServers: Server[] = [
  { id: '1369779785273839749', name: 'GC GD', icon: null, acronym: 'GC', unread: true },
  { id: '1369779785273839750', name: 'GT GC', icon: null, acronym: 'GT' },
  { id: '1369779785273839751', name: 'Serveur Gaming', icon: null, acronym: 'SG', unread: true, mentions: 3 },
  { id: '1369779785273839752', name: 'Sky Genesis', icon: null, acronym: 'SKY' },
  { id: '1369779785273839753', name: 'Dev Team', icon: null, acronym: 'DEV', unread: true },
  { id: '1369779785273839754', name: 'Anime Club', icon: null, acronym: 'AC' },
  { id: '1369779785273839755', name: 'Music Lounge', icon: null, acronym: 'ML' },
]

export const mockCategories: ChannelCategory[] = [
  {
    id: 'cat-1',
    name: 'THE HUB',
    channels: [
      { id: '1373618872514773092', name: 'welcome', type: 'text' },
      { id: '1373618872514773093', name: 'rules', type: 'text' },
      { id: '1373618872514773094', name: 'roles', type: 'text' },
      { id: '1373618872514773095', name: 'languages', type: 'text' },
      { id: '1373618872514773096', name: 'faq', type: 'text' },
      { id: '1373618872514773097', name: 'stats', type: 'text' },
    ],
  },
  {
    id: 'cat-2',
    name: 'NOTIFICATIONS',
    channels: [
      { id: '1373618872514773098', name: 'company', type: 'text' },
      { id: '1373618872514773099', name: 'cloud-updates', type: 'text' },
      { id: '1373618872514773100', name: 'game-updates', type: 'text' },
      { id: '1373618872514773101', name: 'media-updates', type: 'text' },
      { id: '1373618872514773102', name: 'kami-updates', type: 'text' },
      { id: '1373618872514773103', name: 'astron-updates', type: 'text' },
      { id: '1373618872514773104', name: 'server-updates', type: 'text' },
      { id: '1373618872514773105', name: 'partners', type: 'text' },
      { id: '1373618872514773106', name: 'security', type: 'text' },
      { id: '1373618872514773107', name: 'events', type: 'text' },
      { id: '1373618872514773108', name: 'community-highlights', type: 'text' },
      { id: '1373618872514773109', name: 'giveaways', type: 'text' },
    ],
  },
]

export function getServerById(id: string): Server | undefined {
  return mockServers.find((server) => server.id === id)
}

export function getChannelById(id: string): Channel | undefined {
  for (const category of mockCategories) {
    const channel = category.channels.find((channel) => channel.id === id)
    if (channel) return channel
  }
  return undefined
}

export function getWelcomeChannel(): Channel | undefined {
  return mockCategories
    .flatMap((category) => category.channels)
    .find((channel) => channel.name === 'welcome')
}

export function getServerHomeRoute(serverId: string): string {
  const welcomeChannel = getWelcomeChannel()
  const channelId = welcomeChannel?.id ?? 'welcome'
  return `/channels/${serverId}/${channelId}`
}
