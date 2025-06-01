import React from "react";
import { Play, Pause, Heart, Loader2, Music } from "lucide-react";
import { Song } from "@/types/music";

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
  isFavorite: boolean;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying,
  isLoading,
  onPlay,
  onToggleFavorite,
  isFavorite,
}) => {
  return (
    <div
      className={`relative bg-white/5 rounded-lg p-3 shadow-md transition-all ${isPlaying
        ? "ring-2 ring-fuchsia-500 scale-[1.02]"
        : "hover:bg-white/10 hover:scale-[1.01]"
        }`}
    >
      <div className="relative group cursor-pointer" onClick={() => onPlay(song)}>
        {/* Song thumbnail with shimmer loading effect */}
        <div className="relative rounded-md overflow-hidden aspect-video mb-3">
          {!song.thumbnail && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 animate-pulse flex items-center justify-center">
              <Music className="w-8 h-8 text-white/20" />
            </div>
          )}
          <img
            src={song.thumbnail || "/placeholder.svg"}
            alt={song.spotifyTrack?.name || song.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />

          {/* Overlay */}
          <div
            className={`absolute inset-0 backdrop-blur-sm transition-all duration-300 ${isPlaying || isLoading ? 'bg-black/40' : 'bg-black/30 opacity-0 group-hover:opacity-100'
              }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {isLoading ? (
                <div className="bg-black/60 p-3 rounded-full">
                  <Loader2 className="animate-spin h-8 w-8 text-fuchsia-500" />
                </div>
              ) : isPlaying ? (
                <div className="bg-fuchsia-500 p-3 rounded-full animate-in fade-in zoom-in duration-300">
                  <Pause className="h-8 w-8" />
                </div>
              ) : (
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full transform group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8" fill="white" />
                </div>
              )}
            </div>
          </div>

          {/* Status indicators */}
          <div className="absolute bottom-2 right-2 flex items-center space-x-2">
            {/* {isPlaying && (
              <div className="bg-fuchsia-500 text-xs px-2 py-1 rounded-full animate-in slide-in-from-right-5">
                Playing
              </div>
            )} */}
            {isLoading && !isPlaying && (
              <div className="bg-indigo-500 text-xs px-2 py-1 rounded-full flex items-center animate-in slide-in-from-right-5">
                <Loader2 className="animate-spin h-3 w-3 mr-1" />
                Loading
              </div>
            )}
          </div>
        </div>

        {/* Song details with shimmer loading */}
        <div className="space-y-1">
          {song.title || song.spotifyTrack?.name ? (
            <>
              <h3 className="font-semibold text-white truncate">
                {song.spotifyTrack?.name || song.title}
              </h3>
              <p className="text-sm text-gray-300 truncate">
                {song.spotifyTrack?.artist || song.subtitle}
              </p>
            </>
          ) : (
            <>
              <div className="h-5 bg-white/5 rounded animate-pulse" />
              <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
            </>
          )}
        </div>
      </div>

      {/* Favorite button with animations */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(song);
        }}
        className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${isFavorite
          ? 'bg-red-500/20 hover:bg-red-500/30'
          : 'bg-black/50 hover:bg-black/70'
          }`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          size={16}
          className={`transition-transform duration-300 ${isFavorite
            ? 'text-red-500 fill-red-500 scale-110'
            : 'text-white hover:scale-110'
            }`}
        />
      </button>

      {/* Animated playing indicator */}
      {isPlaying && !isLoading && (
        <div className="absolute bottom-3 right-3 flex items-center gap-0.5">
          <div className="w-1 h-3 bg-gradient-to-t from-fuchsia-500 to-purple-500 rounded-full animate-music-playing-1"></div>
          <div className="w-1 h-5 bg-gradient-to-t from-fuchsia-500 to-purple-500 rounded-full animate-music-playing-2"></div>
          <div className="w-1 h-2 bg-gradient-to-t from-fuchsia-500 to-purple-500 rounded-full animate-music-playing-3"></div>
        </div>
      )}
    </div>
  );
};

export default SongCard;
