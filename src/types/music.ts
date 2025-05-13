// types/music.ts
export interface Song {
  id: string;
  title?: string;
  subtitle?: string;
  thumbnail?: string;
  duration?: string;
  views?: string;
  audioUrl: string;
  spotifyTrack?: {
    name?: string;
    artist?: string;
  };
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  songs: Song[];
}

export interface AudioPlayerState {
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  isMuted: boolean;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  coverImage: string;
  description?: string;
  trackCount?: number;
  ownerName?: string;
}
