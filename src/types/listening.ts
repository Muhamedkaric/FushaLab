export type ListeningLocale = 'bs' | 'en' | 'ar'
export type ListeningApproach = 'structured-course' | 'authentic-input' | 'mixed'

export interface ListeningChannel {
  id: string
  name: string
  subtitle?: string
  locales: ListeningLocale[]
  approach: ListeningApproach
  descriptionBs: string
  descriptionEn: string
  youtubeChannelUrl: string
  coverVideoId: string
}

export interface ListeningChannelIndex {
  channels: ListeningChannel[]
}

export interface ListeningPlaylist {
  id: string
  nameBs: string
  nameEn: string
  level: string
  locales: ListeningLocale[]
  descriptionBs: string
  descriptionEn: string
  videoCount?: number
  coverVideoId: string
}

export interface ListeningPlaylistIndex {
  channelId: string
  playlists: ListeningPlaylist[]
}

export interface ListeningVideo {
  youtubeId: string
  title: string
  titleEn?: string
  description?: string
  order: number
  tags?: string[]
}

export interface ListeningPlaylistData {
  channelId: string
  playlistId: string
  locale: ListeningLocale
  videos: ListeningVideo[]
}
