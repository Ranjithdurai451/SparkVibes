/* eslint-disable @typescript-eslint/no-explicit-any */
// components/SpotifyPlaylistSection.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Music,
  Plus,
  List,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Playlist, Song } from "@/types/music";
import { cn } from "@/lib/utils";

// Environment variables for Spotify API
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

interface SpotifyPlaylistSectionProps {
  playlists: Playlist[];
  onAddPlaylist: (playlist: Playlist) => void;
  onPlaylistSelect: (playlist: Playlist) => void;
  clearSearchResults?: () => void;
  selectedPlaylistId?: string;
}

export default function SpotifyPlaylistSection({
  playlists,
  onAddPlaylist,
  onPlaylistSelect,
  clearSearchResults,
  selectedPlaylistId,
}: SpotifyPlaylistSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchProgress, setFetchProgress] = useState<number>(0);

  // Fetch Spotify token when component mounts
  useEffect(() => {
    const getToken = async () => {
      try {
        await axios.post(
          "https://accounts.spotify.com/api/token",
          new URLSearchParams({ grant_type: "client_credentials" }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization:
                "Basic " +
                btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
            },
          }
        );
      } catch (err) {
        console.error("Failed to fetch token:", err);
      }
    };

    getToken();
  }, []);

  // Function to fetch a Spotify playlist
  const getSpotifyPlaylist = async (playlistId: string) => {
    try {
      setFetchProgress(25);

      // Get access token
      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: SPOTIFY_CLIENT_ID,
          client_secret: SPOTIFY_CLIENT_SECRET,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      setFetchProgress(50);

      // Get playlist data
      const { data } = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`,
          },
        }
      );

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
        .filter((song) => song.title !== "Unknown Track");

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
        setIsOpen(false);
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
    <div className="bg-gradient-to-br from-zinc-900/90 to-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <Music className="mr-2 text-green-400" size={20} />
          <span className="text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Playlists
          </span>
        </h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-all duration-300"
            >
              <Plus size={20} />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800/50 text-white shadow-xl max-w-md w-full rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <ExternalLink size={18} className="text-green-400" />
                Add Spotify Playlist
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Enter a Spotify playlist URL to add it to your collection
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
                <Label htmlFor="url" className="text-zinc-300 text-sm">
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
                    className="bg-zinc-800/50 border-zinc-700/50 focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 pr-10 h-11"
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
                      className="bg-gradient-to-r from-green-500 to-green-300 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${fetchProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="border-zinc-700 text-black hover:bg-zinc-800 hover:text-white"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="bg-green-600 hover:bg-green-500 text-white transition-all duration-200"
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

      <div className="max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar space-y-1">
        {playlists.length === 0 ? (
          <div className="text-center py-6 text-zinc-500">
            <Music className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No playlists yet</p>
            <p className="text-xs mt-1">
              Add a Spotify playlist to get started
            </p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              className={cn(
                "flex items-center p-2.5 rounded-lg cursor-pointer transition-all duration-200",
                selectedPlaylistId === playlist.id
                  ? "bg-green-500/20 border border-green-500/30"
                  : "hover:bg-white/5 border border-transparent"
              )}
              onClick={() => {
                if (clearSearchResults) clearSearchResults();
                onPlaylistSelect(playlist);
              }}
            >
              {playlist.thumbnail ? (
                <img
                  src={playlist.thumbnail}
                  alt={playlist.name}
                  className="w-12 h-12 rounded-md mr-3 object-cover shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-md mr-3 bg-zinc-800 flex items-center justify-center">
                  <Music size={20} className="text-zinc-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-white">
                  {playlist.name}
                </div>
                <div className="text-green-400 text-xs flex items-center gap-1">
                  <Music size={10} />
                  <span>{playlist.songs.length} tracks</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
