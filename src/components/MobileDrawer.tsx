import { useState, useEffect } from "react";
import { Heart, X, Music, ListMusic, Star, Plus } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Playlist, Song } from "@/types/music";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "playlists" | "favorites" | "search";
  setActiveTab: (tab: "playlists" | "favorites") => void;
  playlists: Playlist[];
  favorites: Song[];
  setDrawer: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      activeTab: "playlists" | "favorites" | "search";
    }>
  >;
  setCurrentSongIndex: React.Dispatch<React.SetStateAction<number>>;
  currentSongIndex: number;
  isPlaying: boolean;
  onAddPlaylist: (playlist: Playlist) => void;
  onPlaylistSelect: (playlist: Playlist) => void;
  clearSearchResults: () => void;
  onToggleFavorite: (song: Song, index: number) => void;
}

const MobileDrawer = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  playlists,
  favorites,
  onAddPlaylist,
  onPlaylistSelect,
  onToggleFavorite,
  clearSearchResults,
  setDrawer,
  currentSongIndex,
  isPlaying,
  setCurrentSongIndex,
}: MobileDrawerProps) => {
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    setAnimationClass(isOpen ? "translate-y-0" : "translate-y-full");
  }, [isOpen]);

  const handleTabChange = (tab: "playlists" | "favorites") => {
    setActiveTab(tab);
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    onPlaylistSelect(playlist);
    onClose(); // Close the drawer after selection
  };

  const handleFavoriteSongSelect = (index: number) => {
    setDrawer((prev) => ({
      ...prev,
      activeTab: "favorites",
    }));
    setCurrentSongIndex(index);
    onClose(); // Close the drawer after selection
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div
        className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      >
        <div
          className={`fixed bottom-0 left-0 right-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-in-out ${animationClass} h-[90vh] border-t border-purple-500/30`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-purple-500/50 rounded-full" />
          </div>

          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-purple-900/30 px-5 pt-4 pb-4 mb-2 border-b border-purple-500/20">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {activeTab === "playlists"
                  ? "Your Playlists"
                  : "Your Favorites"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Tab navigation */}
            <div className="flex space-x-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTabChange("playlists")}
                className={`rounded-xl gap-2 transition-all duration-200 ${
                  activeTab === "playlists"
                    ? "bg-purple-600/40 text-purple-100 hover:bg-purple-600/50 border border-purple-500/40"
                    : "text-gray-300 hover:text-purple-100 hover:bg-purple-600/20"
                }`}
              >
                <ListMusic size={18} />
                Playlists
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTabChange("favorites")}
                className={`rounded-xl gap-2 transition-all duration-200 ${
                  activeTab === "favorites"
                    ? "bg-pink-600/40 text-pink-100 hover:bg-pink-600/50 border border-pink-500/40"
                    : "text-gray-300 hover:text-pink-100 hover:bg-pink-600/20"
                }`}
              >
                <Heart size={18} />
                Favorites
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(90vh-170px)] overflow-y-auto px-4 pb-4">
            {activeTab === "playlists" ? (
              <>
                {playlists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-900/30 flex items-center justify-center">
                      <Music size={32} className="text-purple-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-200 font-medium">
                        No playlists yet
                      </p>
                      <p className="text-sm text-gray-400">
                        Add your first Spotify playlist to get started
                      </p>
                    </div>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl mt-2"
                      onClick={onClose}
                    >
                      <Plus size={16} className="mr-2" />
                      Add Playlist
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        onClick={() => handlePlaylistSelect(playlist)}
                        className="group flex items-center p-3 rounded-xl bg-gray-800/40 hover:bg-gray-700/50 hover:scale-102 border border-transparent hover:border-purple-500/30 transition-all duration-200 cursor-pointer"
                      >
                        <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                          {playlist.thumbnail ? (
                            <img
                              src={playlist.thumbnail}
                              alt={playlist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                              <Music size={24} className="text-purple-200" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate group-hover:text-purple-200">
                            {playlist.name}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300">
                            {playlist.songs.length} tracks
                          </p>
                        </div>
                        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="p-2 rounded-full bg-purple-600/20">
                            <Music size={16} className="text-purple-300" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-pink-900/30 flex items-center justify-center">
                      <Heart size={32} className="text-pink-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-200 font-medium">
                        No favorites yet
                      </p>
                      <p className="text-sm text-gray-400">
                        Tap the heart icon on songs to add them here
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    {favorites.map((song, index) => (
                      <div
                        key={song.id}
                        className={`flex items-center p-3 rounded-xl group hover:scale-102 transition-all duration-200 ${
                          isPlaying &&
                          activeTab === "favorites" &&
                          currentSongIndex === index
                            ? "bg-pink-600/20 border border-pink-500/40 shadow-lg shadow-pink-900/20"
                            : "bg-gray-800/40 hover:bg-gray-700/50 border border-transparent hover:border-pink-500/30"
                        }`}
                      >
                        <div
                          className="flex items-center flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleFavoriteSongSelect(index)}
                        >
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                            <img
                              src={song.thumbnail}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate group-hover:text-pink-100">
                              {song.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1 truncate group-hover:text-gray-300">
                              {song.subtitle}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 text-pink-500 hover:text-pink-300 hover:bg-pink-600/20 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(song, 0);
                          }}
                        >
                          <Heart size={18} fill="currentColor" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent h-16 pointer-events-none" />
        </div>
      </div>
    </Dialog>
  );
};

export default MobileDrawer;
