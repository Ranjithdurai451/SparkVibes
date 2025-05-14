import React from "react";
import { Play, Pause, Heart, Loader } from "lucide-react";
import { Song } from "@/types/music";

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  currentSongId: string | null;
  isFavorite: boolean;
  onPlay: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
}

const SongCard = ({
  song,
  isPlaying,
  isLoading,
  onPlay,
  onToggleFavorite,
  isFavorite,
}) => {
  return (
    <div
      className={`relative bg-white/5 rounded-lg p-3 shadow-md transition-all ${
        isPlaying ? "ring-2 ring-fuchsia-500" : "hover:bg-white/10"
      }`}
    >
      <div className="relative group cursor-pointer" onClick={onPlay}>
        {/* Song thumbnail with loading overlay */}
        <div className="relative rounded-md overflow-hidden aspect-video mb-3">
          <img
            src={song.thumbnail || "/placeholder.svg?height=48&width=48"}
            alt={song.spotifyTrack?.name || song.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform"
          />

          {/* Play icon overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isLoading ? (
              <div className="bg-black/60 p-3 rounded-full">
                <Loader className="animate-spin h-8 w-8 text-fuchsia-500" />
              </div>
            ) : isPlaying ? (
              <div className="bg-fuchsia-500 p-3 rounded-full">
                <Pause className="h-8 w-8" />
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                <Play className="h-8 w-8" fill="white" />
              </div>
            )}
          </div>

          {/* Playing indicator */}
          {isPlaying && (
            <div className="absolute bottom-2 right-2 bg-fuchsia-500 text-xs px-2 py-1 rounded-full">
              Playing
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !isPlaying && (
            <div className="absolute bottom-2 right-2 bg-indigo-500 text-xs px-2 py-1 rounded-full flex items-center">
              <Loader className="animate-spin h-3 w-3 mr-1" />
              Loading
            </div>
          )}
        </div>

        {/* Song details */}
        <div className="space-y-1">
          <h3 className="font-semibold text-white truncate">
            {song.spotifyTrack?.name || song.title}
          </h3>
          <p className="text-sm text-gray-300 truncate">
            {song.spotifyTrack?.artist || song.subtitle}
          </p>
        </div>
      </div>

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="absolute top-4 right-4 bg-black/50 p-2 rounded-full transition-colors hover:bg-black/70"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          size={16}
          className={isFavorite ? "text-red-500 fill-red-500" : "text-white"}
        />
      </button>

      {/* Playing animation indicator */}
      {isPlaying && !isLoading && (
        <div className="absolute bottom-3 right-3 flex items-center gap-0.5">
          <div className="w-1 h-3 bg-fuchsia-500 rounded-full animate-music-playing-1"></div>
          <div className="w-1 h-5 bg-fuchsia-500 rounded-full animate-music-playing-2"></div>
          <div className="w-1 h-2 bg-fuchsia-500 rounded-full animate-music-playing-3"></div>
        </div>
      )}
    </div>
  );
};
export default SongCard;
