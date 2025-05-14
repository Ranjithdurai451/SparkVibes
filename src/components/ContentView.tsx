import { Music, Loader2, Heart, Search } from "lucide-react";
import SongCard from "./SongCard";

// Simplified loader component
const LoaderComponent = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
    <div className="w-12 h-12 mb-4 relative">
      <div className="absolute inset-0 border-4 border-t-purple-500 border-r-gray-700 border-b-gray-700 border-l-gray-700 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
      </div>
    </div>
    <p className="text-sm font-medium">{message}</p>
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

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 px-4">
        <div className="mb-4 p-3 rounded-full bg-white/5">
          {contentType === "search" ? (
            <Search size={32} className="text-gray-500" />
          ) : (
            <Heart size={32} className="text-gray-500" />
          )}
        </div>
        <h3 className="text-lg font-medium mb-1">Nothing here yet</h3>
        <p className="text-center text-gray-500 max-w-xs text-sm">
          {contentType === "search"
            ? "Search for songs, artists, or albums to get started"
            : "Your favorites will appear here"}
        </p>
      </div>
    );
  }

  // Playlist view
  if (contentType === "playlists" && currentPlaylist) {
    return (
      <div className="px-2 sm:px-0 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold truncate flex items-center">
            <div className="mr-2 p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600">
              <Music size={20} className="text-white" />
            </div>
            {title}
          </h2>
          {onPlaylistBack && (
            <button
              onClick={onPlaylistBack}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-full hover:bg-white/10"
            >
              Back
            </button>
          )}
        </div>

        <div className="space-y-1 rounded-xl overflow-hidden">
          {items.map((song, index) => (
            <div
              key={index}
              className={`group flex items-center p-3 sm:p-4 rounded-lg transition-all cursor-pointer ${
                isPlaying &&
                activeTab === "playlists" &&
                currentSongIndex === index
                  ? "bg-white/10"
                  : "hover:bg-white/5"
              }`}
              onClick={() => onPlaySong(song, "playlists")}
            >
              {/* Track number */}
              <div className="mr-3 sm:mr-4 w-6 sm:w-8 text-center text-gray-400 flex-shrink-0">
                {isPlaying && currentSongIndex === index ? (
                  <div className="flex items-center justify-center h-6">
                    <div className="flex space-x-0.5 items-end h-5">
                      <div className="bg-purple-400 w-1 h-4 animate-pulse delay-100"></div>
                      <div className="bg-purple-400 w-1 h-3 animate-pulse delay-200"></div>
                      <div className="bg-purple-400 w-1 h-4 animate-pulse delay-300"></div>
                    </div>
                  </div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Song info */}
              <div className="flex-grow min-w-0 flex items-center">
                <div className="relative flex-shrink-0">
                  <img
                    src={song.thumbnail || "/api/placeholder/48/48"}
                    alt={song.title || song.spotifyTrack?.name}
                    width={48}
                    height={48}
                    className="w-10 h-10 sm:w-12 sm:h-12 mr-3 sm:mr-4 rounded object-cover transition-transform group-hover:scale-105"
                  />
                  {/* {isPlaying && currentSongIndex === index && (
                    <div className="absolute bottom-1 right-4 w-3 h-3 bg-purple-500 rounded-full border border-black"></div>
                  )} */}
                </div>
                <div className="min-w-0 pr-2">
                  <div className="font-medium text-sm truncate">
                    {song.title || song.spotifyTrack?.name}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {song.subtitle || song.spotifyTrack?.artist}
                  </div>
                </div>
              </div>

              {/* Duration and actions */}
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-400 tabular-nums hidden xs:block">
                  {song.duration
                    ? formatDuration(Number(song.duration))
                    : "--:--"}
                </div>

                {loadingSongs[index] ? (
                  <div className="w-5 h-5 flex items-center justify-center">
                    <Loader2 className="animate-spin w-4 h-4 text-purple-400" />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(song, index);
                    }}
                    className="text-gray-400 hover:text-red-400 focus:text-red-400 p-1.5 rounded-full transition-colors"
                    aria-label={
                      isFavorite(song.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <Heart
                      size={16}
                      className={
                        isFavorite(song.id) ? "text-red-500 fill-red-500" : ""
                      }
                    />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <h2 className="text-xl font-bold flex items-center">
          {contentType === "favorites" ? (
            <Heart className="mr-2 text-red-400" size={18} />
          ) : (
            <Search className="mr-2 text-indigo-400" size={18} />
          )}
          <span>{title}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
            isFavorite={isFavorite(song.id)}
            onPlay={() => onPlaySong(song, contentType)}
            onToggleFavorite={() => onToggleFavorite(song, index)}
          />
        ))}
      </div>
    </div>
  );
};
