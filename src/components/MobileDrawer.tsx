/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import {
  Heart,
  X,
  Music,
  ListMusic,
  Star,
  Plus,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
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
  activeTab = "playlists",
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
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchProgress, setFetchProgress] = useState<number>(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // For swipe functionality
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchMoveY = useRef<number | null>(null);

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

  // Handle touch events for swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY.current) return;

    const currentY = e.touches[0].clientY;
    touchMoveY.current = currentY;

    const diff = currentY - touchStartY.current;

    // Only allow swiping down
    if (diff > 0) {
      // Apply transform to follow finger (with resistance)
      const resistance = 0.4; // Higher = more resistance
      const translateY = diff * resistance;

      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${translateY}px)`;
        // Decrease opacity as drawer is pulled down
        const newOpacity = Math.max(1 - translateY / 400, 0.5);
        drawerRef.current.style.opacity = newOpacity.toString();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchMoveY.current) {
      resetDrawerPosition();
      return;
    }

    const diff = touchMoveY.current - touchStartY.current;

    // If swiped down more than 100px or with high velocity, close drawer
    if (diff > 100) {
      onClose();
    }

    resetDrawerPosition();
    touchStartY.current = null;
    touchMoveY.current = null;
  };

  const resetDrawerPosition = () => {
    if (drawerRef.current) {
      drawerRef.current.style.transform = "";
      drawerRef.current.style.opacity = "1";
    }
  };

  // Function to fetch a Spotify playlist - similar to the one in SpotifyPlaylistSection
  const getSpotifyPlaylist = async (playlistId: string) => {
    try {
      setFetchProgress(25);

      // Get access token
      const tokenResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              btoa(
                `${import.meta.env.VITE_SPOTIFY_CLIENT_ID}:${
                  import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
                }`
              ),
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
          }).toString(),
        }
      );

      const tokenData = await tokenResponse.json();
      setFetchProgress(50);

      // Get playlist data
      const playlistResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      const data = await playlistResponse.json();
      setFetchProgress(75);

      // Format tracks
      const songs: Song[] = data.tracks.items
        .map((item: any) => ({
          title: item.track?.name || "Unknown Track",
          subtitle:
            item.track?.artists?.map((a: any) => a.name).join(", ") ||
            "Unknown Artist",
          spotifyTrack: {
            name: item.track?.name || "Unknown Track",
            artist: item.track?.artists?.[0]?.name || "Unknown Artist",
          },
          thumbnail: item.track?.album?.images?.[0]?.url || "",
          duration: item.track?.duration_ms || 0,
        }))
        .filter((song: any) => song.title !== "Unknown Track");

      setFetchProgress(100);

      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        thumbnail: data.images[0]?.url || "",
        songs,
      };
    } catch (error) {
      console.error("Spotify playlist error:", error);
      return null;
    }
  };

  // Handle adding a new playlist
  const handleAddPlaylist = async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setFetchProgress(0);

    try {
      // Extract playlist ID from URL
      const playlistIdMatch = url.match(/playlist\/([a-zA-Z0-9]+)/);
      if (!playlistIdMatch || !playlistIdMatch[1]) {
        throw new Error("Invalid URL format");
      }

      const playlistId = playlistIdMatch[1];
      const playlist = await getSpotifyPlaylist(playlistId);

      if (playlist && playlist.songs.length > 0) {
        onAddPlaylist(playlist);
        setUrl("");
        setAddDialogOpen(false);
      } else {
        setError("Could not load playlist or playlist is empty");
      }
    } catch (err) {
      setError("Invalid Spotify playlist URL");
    } finally {
      setIsLoading(false);
    }
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
          ref={drawerRef}
          className={`fixed bottom-0 left-0 right-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 rounded-t-3xl shadow-2xl transition-all duration-300 ease-in-out ${animationClass} h-[75vh] border-t border-purple-500/30`}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
          }}
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
                    <Dialog
                      open={addDialogOpen}
                      onOpenChange={setAddDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl mt-2">
                          <Plus size={16} className="mr-2" />
                          Add Playlist
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800/50 text-white shadow-xl max-w-md w-full rounded-xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl flex items-center gap-2">
                            <ExternalLink
                              size={18}
                              className="text-purple-400"
                            />
                            Add Spotify Playlist
                          </DialogTitle>
                          <DialogDescription className="text-zinc-400">
                            Enter a Spotify playlist URL to add it to your
                            collection
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddPlaylist();
                          }}
                          className="space-y-5 mt-2"
                        >
                          <div className="space-y-2">
                            <Label
                              htmlFor="url"
                              className="text-zinc-300 text-sm"
                            >
                              Playlist URL
                            </Label>
                            <div className="relative">
                              <Input
                                id="url"
                                value={url}
                                onChange={(e) => {
                                  setUrl(e.target.value);
                                  setError(null);
                                }}
                                placeholder="https://open.spotify.com/playlist/..."
                                className="bg-zinc-800/50 border-zinc-700/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 pr-10 h-11"
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500">
                                <Music size={16} />
                              </div>
                            </div>
                          </div>

                          {error && (
                            <Alert
                              variant="destructive"
                              className="bg-red-900/20 border border-red-800/40 text-red-200"
                            >
                              <AlertCircle className="h-4 w-4 text-red-400" />
                              <div className="ml-2">
                                <AlertTitle className="text-red-300 text-sm font-medium">
                                  Error
                                </AlertTitle>
                                <AlertDescription className="text-red-200 text-xs">
                                  {error}
                                </AlertDescription>
                              </div>
                            </Alert>
                          )}

                          {isLoading && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs text-zinc-500">
                                <span>Loading playlist...</span>
                                <span>{fetchProgress}%</span>
                              </div>
                              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                <div
                                  className="bg-gradient-to-r from-purple-500 to-purple-300 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${fetchProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <DialogFooter className="gap-2 sm:gap-0">
                            <DialogClose asChild>
                              <Button
                                variant="outline"
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                            </DialogClose>
                            <Button
                              type="submit"
                              disabled={isLoading || !url.trim()}
                              className="bg-purple-600 hover:bg-purple-500 text-white transition-all duration-200"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Importing...
                                </>
                              ) : (
                                "Add Playlist"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-400">
                        Your Collection ({playlists.length})
                      </h4>
                      <Dialog
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-600/20 rounded-full h-8 w-8 p-0"
                          >
                            <Plus size={16} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800/50 text-white shadow-xl max-w-md w-full rounded-xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl flex items-center gap-2">
                              <ExternalLink
                                size={18}
                                className="text-purple-400"
                              />
                              Add Spotify Playlist
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400">
                              Enter a Spotify playlist URL to add it to your
                              collection
                            </DialogDescription>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleAddPlaylist();
                            }}
                            className="space-y-5 mt-2"
                          >
                            <div className="space-y-2">
                              <Label
                                htmlFor="url"
                                className="text-zinc-300 text-sm"
                              >
                                Playlist URL
                              </Label>
                              <div className="relative">
                                <Input
                                  id="url"
                                  value={url}
                                  onChange={(e) => {
                                    setUrl(e.target.value);
                                    setError(null);
                                  }}
                                  placeholder="https://open.spotify.com/playlist/..."
                                  className="bg-zinc-800/50 border-zinc-700/50 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 pr-10 h-11"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500">
                                  <Music size={16} />
                                </div>
                              </div>
                            </div>

                            {error && (
                              <Alert
                                variant="destructive"
                                className="bg-red-900/20 border border-red-800/40 text-red-200"
                              >
                                <AlertCircle className="h-4 w-4 text-red-400" />
                                <div className="ml-2">
                                  <AlertTitle className="text-red-300 text-sm font-medium">
                                    Error
                                  </AlertTitle>
                                  <AlertDescription className="text-red-200 text-xs">
                                    {error}
                                  </AlertDescription>
                                </div>
                              </Alert>
                            )}

                            {isLoading && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-zinc-500">
                                  <span>Loading playlist...</span>
                                  <span>{fetchProgress}%</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                                  <div
                                    className="bg-gradient-to-r from-purple-500 to-purple-300 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${fetchProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0">
                              <DialogClose asChild>
                                <Button
                                  variant="outline"
                                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                  disabled={isLoading}
                                >
                                  Cancel
                                </Button>
                              </DialogClose>
                              <Button
                                type="submit"
                                disabled={isLoading || !url.trim()}
                                className="bg-purple-600 hover:bg-purple-500 text-white transition-all duration-200"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importing...
                                  </>
                                ) : (
                                  "Add Playlist"
                                )}
                              </Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
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
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-400">
                        Your Favorites ({favorites.length})
                      </h4>
                    </div>
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

          {/* Footer with gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent h-16 pointer-events-none" />
        </div>
      </div>
    </Dialog>
  );
};

export default MobileDrawer;
