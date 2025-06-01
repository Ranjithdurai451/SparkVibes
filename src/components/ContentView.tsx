import React from "react";
import { Music, Loader2, Heart, Search, ChevronLeft } from "lucide-react";
import SongCard from "./SongCard";

// Enhanced loader component with animation
const LoaderComponent = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <div className="w-16 h-16 mb-4 relative">
      <div className="absolute inset-0 border-4 border-t-fuchsia-500 border-r-indigo-500 border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Music className="w-8 h-8 text-white/30 animate-pulse" />
      </div>
    </div>
    <p className="text-sm font-medium bg-gradient-to-r from-fuchsia-500 to-purple-500 bg-clip-text text-transparent animate-pulse">
      {message}
    </p>
  </div>
);

// Playlist item component for better organization
const PlaylistItem = ({
  song,
  index,
  isPlaying,
  isLoading,
  currentSongIndex,
  onPlay,
  onToggleFavorite,
  isFavorite,
  formatDuration,
}) => (
  <div
    className={`group flex items-center p-3 sm:p-4 rounded-lg transition-all cursor-pointer ${isPlaying && currentSongIndex === index
      ? "bg-white/10 scale-[1.01]"
      : "hover:bg-white/5"
      }`}
    onClick={() => onPlay(song, "playlists")}
  >
    {/* Track number with animated equalizer */}
    <div className="mr-3 sm:mr-4 w-6 sm:w-8 text-center text-gray-400 flex-shrink-0">
      {isPlaying && currentSongIndex === index ? (
        <div className="flex items-center justify-center h-6">
          <div className="flex space-x-0.5 items-end">
            <div className="bg-gradient-to-t from-fuchsia-500 to-purple-500 w-1 h-4 animate-music-bar-1"></div>
            <div className="bg-gradient-to-t from-fuchsia-500 to-purple-500 w-1 h-2 animate-music-bar-2"></div>
            <div className="bg-gradient-to-t from-fuchsia-500 to-purple-500 w-1 h-3 animate-music-bar-3"></div>
          </div>
        </div>
      ) : (
        <span className="opacity-50 group-hover:opacity-100">{index + 1}</span>
      )}
    </div>

    {/* Song thumbnail and info */}
    <div className="flex-grow min-w-0 flex items-center">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 mr-3 sm:mr-4 rounded-lg overflow-hidden">
          {!song.thumbnail ? (
            <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 animate-pulse flex items-center justify-center">
              <Music className="w-6 h-6 text-white/20" />
            </div>
          ) : (
            <img
              src={song.thumbnail}
              alt={song.title || song.spotifyTrack?.name}
              className={`w-full h-full object-cover transition-transform duration-300 ${isPlaying ? "scale-110" : "group-hover:scale-105"
                }`}
            />
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white/70" />
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-grow">
        <div className="font-medium text-sm truncate text-white/90 group-hover:text-white transition-colors">
          {song.title || song.spotifyTrack?.name}
        </div>
        <div className="text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors">
          {song.subtitle || song.spotifyTrack?.artist}
        </div>
      </div>
    </div>

    {/* Duration and actions */}
    <div className="flex items-center space-x-3 ml-4">
      <div className="text-xs text-gray-400 tabular-nums hidden xs:block transition-colors group-hover:text-gray-300">
        {song.duration ? formatDuration(Number(song.duration)) : "--:--"}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(song, index);
        }}
        className={`text-gray-400 p-2 rounded-full transition-all ${isFavorite(song.id)
          ? "text-red-500 bg-red-500/10"
          : "hover:text-red-400 hover:bg-white/5"
          }`}
        aria-label={isFavorite(song.id) ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          size={16}
          className={isFavorite(song.id) ? "fill-red-500" : ""}
        />
      </button>
    </div>
  </div>
);

export const ContentView = ({
  title,
  contentType,
  isLoading,
  items,
  currentPlaylist,
  currentSongIndex,
  isPlaying,
  activeTab,
  onPlaySong,
  onToggleFavorite,
  isFavorite,
  loadingSongs,
  formatDuration,
  onPlaylistBack,
  playerState,
}) => {
  // Loading state
  if (isLoading) {
    return <LoaderComponent />;
  }

  // Empty state with enhanced animations
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 px-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-white/5 to-white/10 animate-pulse">
          {contentType === "search" ? (
            <Search size={32} className="text-gray-500" />
          ) : (
            <Heart size={32} className="text-gray-500" />
          )}
        </div>
        <h3 className="text-lg font-medium mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Nothing here yet
        </h3>
        <p className="text-center text-gray-500 max-w-xs text-sm">
          {contentType === "search"
            ? "Search for your favorite songs to get started"
            : "Your favorites will appear here"}
        </p>
      </div>
    );
  }

  // Playlist view with enhanced UI
  if (contentType === "playlists" && currentPlaylist) {
    return (
      <div className="px-2 sm:px-0 max-w-4xl mx-auto animate-in fade-in duration-300">
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-black/30 -mx-2 px-2 py-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onPlaylistBack && (
                <button
                  onClick={onPlaylistBack}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  aria-label="Back to playlists"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <h2 className="text-xl sm:text-2xl font-bold truncate flex items-center w-full">
                <div className="mr-2 p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600">
                  <Music size={20} className="text-white" />
                </div>
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-1 rounded-xl">
          {items.map((song, index) => (
            <PlaylistItem
              key={song.id || index}
              song={song}
              index={index}
              isPlaying={isPlaying && activeTab === "playlists" && currentSongIndex === index}
              isLoading={loadingSongs[index] || (currentSongIndex === index && playerState?.isBuffering)}
              currentSongIndex={currentSongIndex}
              onPlay={onPlaySong}
              onToggleFavorite={onToggleFavorite}
              isFavorite={isFavorite}
              formatDuration={formatDuration}
            />
          ))}
        </div>
      </div>
    );
  }

  // Grid view with enhanced animations
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center sticky top-0 z-10 backdrop-blur-xl bg-black/30 -mx-2 px-2 py-4">
        <h2 className="text-xl font-bold flex items-center">
          {contentType === "favorites" ? (
            <Heart className="mr-2 text-red-400" size={18} />
          ) : (
            <Search className="mr-2 text-indigo-400" size={18} />
          )}
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {title}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-2 sm:px-0">
        {items.map((song, index) => (
          <SongCard
            key={song.id || index}
            song={song}
            isPlaying={
              isPlaying &&
              activeTab === contentType &&
              currentSongIndex === index
            }
            isLoading={
              loadingSongs[index] ||
              (currentSongIndex === index && playerState?.isBuffering)
            }
            onPlay={() => onPlaySong(song, contentType)}
            onToggleFavorite={() => onToggleFavorite(song, index)}
            isFavorite={isFavorite(song.id)}
          />
        ))}
      </div>
    </div>
  );
};
