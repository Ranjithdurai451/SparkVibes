/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Search,
  Volume2,
  VolumeX,
  Music,
  Heart,
  Loader,
  Menu,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileDrawer from "./MobileDrawer";
import SpotifyPlaylistSection from "./SpotifyPlaylistSection";
import { ContentView } from "./ContentView";

// Constants
const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3/search";
const LOCAL_STORAGE_KEYS = {
  FAVORITES: "sparkmusic-favorites",
  PLAYLISTS: "sparkmusic-playlists",
  VOLUME: "sparkmusic-volume",
};

// YouTube API Type Declaration
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function SparkMusicPlayer() {
  // State Management
  const [query, setQuery] = useState("tamil best songs");
  const [searchResults, setSearchResults] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState({});
  const [drawer, setDrawer] = useState<{
    isOpen: boolean;
    activeTab: "search" | "favorites" | "playlists";
  }>({
    isOpen: false,
    activeTab: "search",
  });
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    volume: 70,
    currentTime: 0,
    duration: 0,
    isLoading: false, // Already exists
    isMuted: false,
    isBuffering: false, // Add this new state to track buffering/loading
  });
  const [isSearching, setIsSearching] = useState(false);
  const [youtubeApiReady, setYoutubeApiReady] = useState(false);
  const [contentView, setContentView] = useState("search"); // search, favorites, playlists
  useEffect(() => {
    console.log("Drawer state changed:", drawer);
  }, [drawer]);
  // Refs
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevVolumeRef = useRef(playerState.volume);

  // Destructured state for easier access
  const {
    isPlaying,
    volume,
    currentTime,
    duration,
    isMuted,
    isBuffering,
    isLoading,
  } = playerState;

  const currentList =
    drawer.activeTab === "favorites"
      ? favorites
      : drawer.activeTab === "playlists" && currentPlaylist
        ? currentPlaylist.songs
        : searchResults;
  // console.log("currentList", currentList);
  // Get current content based on contentView state (no useMemo)
  const currentContent =
    contentView === "search"
      ? {
        title: "Search Results",
        items: searchResults,
        type: "search",
      }
      : contentView === "favorites"
        ? {
          title: `Favorites (${favorites.length})`,
          items: favorites,
          type: "favorites",
        }
        : contentView === "playlists"
          ? {
            title: currentPlaylist?.name || "Playlist",
            items: currentPlaylist?.songs || [],
            type: "playlists",
          }
          : {
            title: "Search Results",
            items: searchResults,
            type: "search",
          };

  const currentSong = useMemo(
    () =>
      currentSongIndex >= 0 && currentList.length > 0
        ? currentList[currentSongIndex]
        : null,
    [currentSongIndex, currentList]
  );

  const progressPercentage = useMemo(
    () => (duration ? (currentTime / duration) * 100 : 0),
    [currentTime, duration]
  );

  // Initialize YouTube API
  useEffect(() => {
    const initializeYouTube = () => {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";

        tag.onload = () => {
          window.onYouTubeIframeAPIReady = () => {
            setYoutubeApiReady(true);
            console.log("YouTube API Ready");
          };
        };

        document.body.appendChild(tag);
      } else {
        setYoutubeApiReady(true);
      }
    };

    // Load data from localStorage
    const loadData = () => {
      try {
        const savedFavorites = localStorage.getItem(
          LOCAL_STORAGE_KEYS.FAVORITES
        );
        const savedPlaylists = localStorage.getItem(
          LOCAL_STORAGE_KEYS.PLAYLISTS
        );
        const savedVolume = localStorage.getItem(LOCAL_STORAGE_KEYS.VOLUME);

        if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
        if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists));
        if (savedVolume) {
          const vol = parseInt(savedVolume);
          setPlayerState((prev) => ({ ...prev, volume: vol }));
          prevVolumeRef.current = vol;
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
    initializeYouTube();

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.FAVORITES,
      JSON.stringify(favorites)
    );
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.PLAYLISTS,
      JSON.stringify(playlists)
    );
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VOLUME, String(volume));
  }, [volume]);

  // Update content view when drawer tab changes
  useEffect(() => {
    switch (drawer.activeTab) {
      case "search":
        setContentView("search");
        break;
      case "favorites":
        setContentView("favorites");
        break;
      case "playlists":
        if (currentPlaylist) {
          setContentView("playlists");
        }
        break;
    }
  }, [drawer.activeTab, currentPlaylist]);

  // Initialize player when current song changes
  useEffect(() => {
    if (currentSong && youtubeApiReady && iframeRef.current) {
      console.log(currentSong);
      initializePlayer();
    }
  }, [currentSong, youtubeApiReady]);

  // Player Functions
  const initializePlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(iframeRef.current, {
      height: "0",
      width: "0",
      videoId: currentSong?.id,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: (event) => {
          event.target.playVideo();
          event.target.setVolume(volume);
          setPlayerState((prev) => ({ ...prev, isPlaying: true }));
          startProgressTracker(event.target);
        },
        onStateChange: (event) => handlePlayerStateChange(event.data),
        onError: () => playNextSong(),
      },
    });
  }, [currentSong, volume]);

  const handlePlayerStateChange = (state) => {
    switch (state) {
      case 1: // playing
        setPlayerState((prev) => ({
          ...prev,
          isPlaying: true,
          isBuffering: false,
        }));
        break;
      case 2: // paused
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        break;
      case 0: // ended
        console.log(" Drawer", drawer.activeTab);
        console.log("Song ended");
        playNextSong();
        break;
      case 3: // buffering
        setPlayerState((prev) => ({ ...prev, isBuffering: true }));
        break;
    }
  };

  const startProgressTracker = useCallback((player) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      try {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();

        setPlayerState((prev) => ({
          ...prev,
          currentTime,
          duration,
        }));
      } catch (error) {
        console.error("Error tracking progress:", error);
        clearInterval(intervalRef.current);
      }
    }, 1000);
  }, []);

  // Search Functions
  const searchSongs = async () => {
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          part: "snippet",
          q: query,
          key: YT_API_KEY,
          maxResults: 15,
          type: "video",
          videoCategoryId: "10", // Music category
        },
      });

      const results = response.data.items.map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        subtitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.high.url,
        duration: "0", // Duration is fetched from player
        audioUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));

      setSearchResults(results);
      setDrawer((prev) => ({ ...prev, activeTab: "search" }));
      setContentView("search");

      // Auto-play first song from search results
      if (results.length > 0) {
        setCurrentSongIndex(0);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const searchYouTube = useCallback(async (query) => {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          part: "snippet",
          q: query,
          key: YT_API_KEY,
          maxResults: 1,
          type: "video",
          videoCategoryId: "10",
        },
      });

      const item = response.data.items[0];
      if (!item) return null;

      console.log("Searched video" + item);

      return {
        id: item.id.videoId,
        audioUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    } catch (error) {
      console.error("YouTube search error:", error);
      return null;
    }
  }, []);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initializeAudio = async () => {
    try {
      if (audioContextRef.current) return;

      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // iOS requires a silent initial playback
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
    } catch (error) {
      console.error("Audio initialization error:", error);
    }
  };

  // Playback Control Functions
  const playSong = useCallback(
    async (song, newTab = null) => {
      await initializeAudio();
      // Update the active tab and content view if needed
      if (newTab) {
        setDrawer((prev) => ({ ...prev, activeTab: newTab }));

        switch (newTab) {
          case "search":
            setDrawer((prev) => ({ ...prev, activeTab: "search" }));
            setContentView("search");
            break;
          case "favorites":
            setDrawer((prev) => ({ ...prev, activeTab: "favorites" }));
            setContentView("favorites");
            break;
          case "playlists":
            setDrawer((prev) => ({ ...prev, activeTab: "playlists" }));
            setContentView("playlists");
            break;
        }
      }

      // Get the appropriate list to use based on the tab
      let listToUse;
      switch (newTab || drawer.activeTab) {
        case "search":
          listToUse = searchResults;
          break;
        case "favorites":
          listToUse = favorites;
          break;
        case "playlists":
          listToUse = currentPlaylist?.songs || [];
          break;
        default:
          listToUse = currentList;
      }
      // setCurrentPlaylist(listToUse);
      // Find the index of the song in the list
      const songIndex = listToUse.findIndex(
        (s) =>
          s === song ||
          (s.id && song.id && s.id === song.id) ||
          (s.spotifyTrack &&
            song.spotifyTrack &&
            s.spotifyTrack.name === song.spotifyTrack.name)
      );

      // Check if we need to fetch a YouTube ID for this Spotify track
      if (!song.id && song.spotifyTrack) {
        setLoadingSongs((prev) => ({ ...prev, [songIndex]: true }));

        try {
          const query = `${song.spotifyTrack.name} ${song.spotifyTrack.artist}`;
          const youtubeSong = await searchYouTube(query);

          if (youtubeSong) {
            const updatedSong = { ...song, ...youtubeSong };

            if (currentPlaylist) {
              // Update the song in playlist
              const updatedPlaylist = {
                ...currentPlaylist,
                songs: currentPlaylist.songs.map((s) =>
                  s === song ? updatedSong : s
                ),
              };

              setPlaylists((prev) =>
                prev.map((p) =>
                  p.id === currentPlaylist.id ? updatedPlaylist : p
                )
              );

              setCurrentPlaylist(updatedPlaylist);
            }

            setCurrentSongIndex(songIndex);
          }
        } catch (error) {
          console.error("Error playing song:", error);
        } finally {
          // Clear loading state for this song
          setLoadingSongs((prev) => {
            const updated = { ...prev };
            delete updated[songIndex];
            return updated;
          });
        }
      } else if (song.id) {
        // If the song already has a YouTube ID, just play it
        setCurrentSongIndex(songIndex);
      }
    },
    [
      currentList,
      currentPlaylist,
      searchYouTube,
      searchResults,
      favorites,
      drawer.activeTab,
    ]
  );

  const togglePlayPause = () => {
    if (!currentSong || !playerRef.current) return;

    try {
      const state = playerRef.current.getPlayerState();
      if (state === 1) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  const playNextSong = async () => {
    console.log("list", currentList);
    console.log(drawer.activeTab);
    if (currentList.length <= 1) return;

    // Set loading state immediately
    setPlayerState((prev) => ({ ...prev, isBuffering: true }));

    const nextIndex = (currentSongIndex + 1) % currentList.length;
    const nextSong = currentList[nextIndex];

    // Check if the next song needs a YouTube ID
    if (!nextSong.id && nextSong.spotifyTrack) {
      // Set loading state for this specific song
      setLoadingSongs((prev) => ({ ...prev, [nextIndex]: true }));

      try {
        const query = `${nextSong.spotifyTrack.name} ${nextSong.spotifyTrack.artist}`;
        const youtubeSong = await searchYouTube(query);

        if (youtubeSong) {
          const updatedSong = { ...nextSong, ...youtubeSong };

          // Update the song in the playlist if we're in playlist mode
          if (currentPlaylist) {
            const updatedPlaylist = {
              ...currentPlaylist,
              songs: currentPlaylist.songs.map((s, idx) =>
                idx === nextIndex ? updatedSong : s
              ),
            };

            setPlaylists((prev) =>
              prev.map((p) =>
                p.id === currentPlaylist.id ? updatedPlaylist : p
              )
            );

            setCurrentPlaylist(updatedPlaylist);
          }

          setCurrentSongIndex(nextIndex);
        } else {
          // If no YouTube match was found, try the next song
          setLoadingSongs((prev) => {
            const updated = { ...prev };
            delete updated[nextIndex];
            return updated;
          });

          // Try to play the song after the next one
          const skipNextIndex = (nextIndex + 1) % currentList.length;
          setCurrentSongIndex(skipNextIndex);
        }
      } catch (error) {
        console.error("Error finding YouTube ID for next song:", error);
        // On error, try to play a different song
        setCurrentSongIndex((nextIndex + 1) % currentList.length);
        setPlayerState((prev) => ({ ...prev, isBuffering: false }));
      } finally {
        // Clear loading state for this song
        setLoadingSongs((prev) => {
          const updated = { ...prev };
          delete updated[nextIndex];
          return updated;
        });
      }
    } else {
      // If the song already has a YouTube ID, just play it
      setCurrentSongIndex(nextIndex);
      // Note: buffering state will be managed by the YouTube player events
    }
  };

  // 2. Update playPreviousSong similarly
  const playPreviousSong = async () => {
    if (currentList.length <= 1) return;

    // Set loading state immediately
    setPlayerState((prev) => ({ ...prev, isBuffering: true }));

    const prevIndex =
      (currentSongIndex - 1 + currentList.length) % currentList.length;
    const prevSong = currentList[prevIndex];

    // Check if the previous song needs a YouTube ID
    if (!prevSong.id && prevSong.spotifyTrack) {
      // Set loading state for this specific song
      setLoadingSongs((prev) => ({ ...prev, [prevIndex]: true }));

      try {
        const query = `${prevSong.spotifyTrack.name} ${prevSong.spotifyTrack.artist}`;
        const youtubeSong = await searchYouTube(query);

        if (youtubeSong) {
          const updatedSong = { ...prevSong, ...youtubeSong };

          // Update the song in the playlist if we're in playlist mode
          if (currentPlaylist) {
            const updatedPlaylist = {
              ...currentPlaylist,
              songs: currentPlaylist.songs.map((s, idx) =>
                idx === prevIndex ? updatedSong : s
              ),
            };

            setPlaylists((prev) =>
              prev.map((p) =>
                p.id === currentPlaylist.id ? updatedPlaylist : p
              )
            );

            setCurrentPlaylist(updatedPlaylist);
          }

          setCurrentSongIndex(prevIndex);
        } else {
          // If no YouTube match was found, try previous song
          setLoadingSongs((prev) => {
            const updated = { ...prev };
            delete updated[prevIndex];
            return updated;
          });

          // Try another song
          const skipPrevIndex =
            (prevIndex - 1 + currentList.length) % currentList.length;
          setCurrentSongIndex(skipPrevIndex);
        }
      } catch (error) {
        console.error("Error finding YouTube ID for previous song:", error);
        // On error, try the song before the previous one
        setCurrentSongIndex(
          (prevIndex - 1 + currentList.length) % currentList.length
        );
        setPlayerState((prev) => ({ ...prev, isBuffering: false }));
      } finally {
        // Clear loading state for this song
        setLoadingSongs((prev) => {
          const updated = { ...prev };
          delete updated[prevIndex];
          return updated;
        });
      }
    } else {
      // If the song already has a YouTube ID, just play it
      setCurrentSongIndex(prevIndex);
      // Note: buffering state will be managed by the YouTube player events
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.setVolume(prevVolumeRef.current);
      setPlayerState((prev) => ({
        ...prev,
        volume: prevVolumeRef.current,
        isMuted: false,
      }));
    } else {
      prevVolumeRef.current = volume;
      playerRef.current.setVolume(0);
      setPlayerState((prev) => ({
        ...prev,
        volume: 0,
        isMuted: true,
      }));
    }
  };

  // UI Interaction Handlers
  const handleSeek = useCallback(
    (e) => {
      if (!duration || !playerRef.current) return;

      const progressBar = e.currentTarget;
      const bounds = progressBar.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const ratio = Math.max(0, Math.min(1, x / bounds.width));
      const seekTime = ratio * duration;

      playerRef.current.seekTo(seekTime, true);
      setPlayerState((prev) => ({ ...prev, currentTime: seekTime }));
    },
    [duration]
  );

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseInt(e.target.value);

    setPlayerState((prev) => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0,
    }));

    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  }, []);

  const toggleFavorite = useCallback(
    async (song, index) => {
      // If the song doesn't have a YouTube ID yet, fetch it first
      if (!song.id && song.spotifyTrack) {
        setLoadingSongs((prev) => ({
          ...prev,
          [index]: true,
        }));

        try {
          const query = `${song.spotifyTrack.name} ${song.spotifyTrack.artist}`;
          const youtubeSong = await searchYouTube(query);

          if (youtubeSong) {
            const updatedSong = { ...song, ...youtubeSong };

            // Replace in playlists if needed
            if (currentPlaylist) {
              const updatedPlaylist = {
                ...currentPlaylist,
                songs: currentPlaylist.songs.map((s) =>
                  s.spotifyTrack?.name === song.spotifyTrack.name
                    ? updatedSong
                    : s
                ),
              };
              setPlaylists((prev) =>
                prev.map((p) =>
                  p.id === currentPlaylist.id ? updatedPlaylist : p
                )
              );
              setCurrentPlaylist(updatedPlaylist);
            }

            // Now add to favorites
            setFavorites((prev) => {
              const alreadyFavorited = prev.some(
                (fav) => fav.id === updatedSong.id
              );
              return alreadyFavorited ? prev : [...prev, updatedSong];
            });
          }
        } catch (error) {
          console.error("Error fetching song before favorite:", error);
        } finally {
          setLoadingSongs((prev) => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
          });
        }
      } else if (song.id) {
        // Song already has YouTube data — proceed normally
        setFavorites((prev) => {
          const alreadyFavorited = prev.some((fav) => fav.id === song.id);

          if (alreadyFavorited) {
            return prev.filter((fav) => fav.id !== song.id);
          } else {
            return [...prev, song];
          }
        });
      }
    },
    [favorites, currentPlaylist, searchYouTube]
  );

  // Helper Functions
  const isFavorite = useCallback(
    (songId) => {
      return favorites.some((fav) => fav.id === songId);
    },
    [favorites]
  );

  const formatTime = useCallback((time) => {
    if (isNaN(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }, []);

  const formatDuration = useCallback((ms) => {
    if (!ms || isNaN(ms)) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? "0" : ""}${seconds}`;
  }, []);

  const openDrawer = useCallback(
    (tab) => {
      setDrawer({ isOpen: true, activeTab: tab });

      // Update content view based on tab
      switch (tab) {
        case "search":
          setContentView("search");
          break;
        case "favorites":
          setContentView("favorites");
          break;
        case "playlists":
          if (currentPlaylist) {
            setContentView("playlists");
          }
          break;
      }
    },
    [currentPlaylist]
  );

  // Handler for playlist selection
  const handlePlaylistSelect = (playlist) => {
    setCurrentPlaylist(playlist);
    setContentView("playlists");
    setDrawer((prev) => ({ ...prev, activeTab: "playlists" }));
  };

  const useMediaKeyboardShortcuts = (
    isPlaying,
    togglePlayPause,
    playNextSong,
    playPreviousSong,
    currentSong,
    playerRef,
    setPlayerState
  ) => {
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (!currentSong) return;

        if (
          e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.isContentEditable
        )
          return;

        switch (e.key) {
          case " ":
            e.preventDefault();
            togglePlayPause();
            break;
          case "ArrowRight":
            e.preventDefault();
            playNextSong();
            break;
          case "ArrowLeft":
            e.preventDefault();
            playPreviousSong();
            break;
          case "ArrowUp":
            e.preventDefault();
            adjustVolume(10); // Increase by 10
            break;
          case "ArrowDown":
            e.preventDefault();
            adjustVolume(-10); // Decrease by 10
            break;
          case "k":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              togglePlayPause();
            }
            break;
          case "j":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              playPreviousSong();
            }
            break;
          case "l":
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              playNextSong();
            }
            break;
          default:
            break;
        }
      };

      const adjustVolume = (change) => {
        setPlayerState((prev) => {
          const newVolume = Math.min(100, Math.max(0, prev.volume + change));
          if (playerRef.current) {
            playerRef.current.setVolume(newVolume);
          }
          return {
            ...prev,
            volume: newVolume,
            isMuted: newVolume === 0,
          };
        });
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [
      isPlaying,
      togglePlayPause,
      playNextSong,
      playPreviousSong,
      currentSong,
      playerRef,
      setPlayerState,
    ]);
  };

  useMediaKeyboardShortcuts(
    isPlaying,
    togglePlayPause,
    playNextSong,
    playPreviousSong,
    currentSong,
    playerRef,
    setPlayerState
  );

  // Return the UI
  return (
    <div className="h-dvh bg-gradient-to-b from-gray-900 to-black text-white pb-24 overflow-hidden">
      <button
        onClick={() => openDrawer("playlists")}
        className="block lg:hidden p-1 text-gray-300 hover:text-white rounded-full bg-white/10 absolute top-4 right-4 z-50 transition-all"
        aria-label="Search Results"
      >
        <Menu size={16} />
      </button>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Header Section */}
        <header className="mb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-teal-400 flex items-center space-x-2">
              <span>SparkVibes</span>
              <Music className="ml-2 text-fuchsia-500" />
            </h1>
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search any song..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchSongs()}
                  className="w-full bg-white/5 text-white border border-white/10 p-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                />
                <Search className="absolute left-3 text-gray-400" size={18} />
                <button
                  onClick={searchSongs}
                  disabled={isSearching}
                  className="absolute right-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white px-4 py-1.5 rounded-lg transition-all disabled:opacity-70"
                >
                  {isSearching ? (
                    <Loader className="animate-spin h-5 w-5" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
          {/* Content Section */}
          <div className="lg:col-span-2 bg-black/20 backdrop-blur-lg border border-white/5 rounded-2xl p-4 shadow-xl max-h-[75dvh]  h-[75dvh] overflow-y-auto custom-scrollbar">
            <ContentView
              title={currentContent.title}
              contentType={currentContent.type}
              isLoading={isSearching}
              items={currentContent.items}
              currentPlaylist={currentPlaylist}
              currentSongIndex={currentSongIndex}
              isPlaying={isPlaying}
              activeTab={drawer.activeTab}
              playerState={playerState}
              onPlaySong={playSong}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              loadingSongs={loadingSongs}
              formatDuration={formatDuration}
              onPlaylistBack={() => setCurrentPlaylist(null)}
            />
          </div>
          <div className="hidden lg:block lg:col-span-1 space-y-2">
            {/* Playlist Section */}
            <SpotifyPlaylistSection
              playlists={playlists}
              onAddPlaylist={(newPlaylist) =>
                setPlaylists((prev) => [...prev, newPlaylist])
              }
              clearSearchResults={() => setSearchResults([])}
              onPlaylistSelect={handlePlaylistSelect}
            />

            {/* Favorites Section */}
            <div className="bg-black/20 backdrop-blur-lg border border-white/5 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center">
                  <Heart className="mr-2 text-red-400" size={18} />
                  <span className="text-white">
                    Favorites ({favorites.length})
                  </span>
                </h2>
              </div>
              <div className="max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                {favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Heart size={32} className="mb-3 opacity-30" />
                    <p className="text-center">No favorites yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Click the heart icon on songs to add them here
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {favorites.map((song, index) => (
                      <li
                        key={song.id}
                        className={`flex items-center justify-between p-2 rounded-lg group transition-all hover:bg-white/5 ${isPlaying &&
                          drawer.activeTab === "favorites" &&
                          currentSongIndex === index
                          ? "bg-white/5"
                          : ""
                          }`}
                      >
                        <div
                          className="flex items-center flex-grow cursor-pointer overflow-hidden"
                          onClick={() => {
                            setDrawer((prev) => ({
                              ...prev,
                              activeTab: "favorites",
                            }));
                            setCurrentSongIndex(index);
                          }}
                        >
                          <div className="w-10 h-10 flex-shrink-0 bg-gray-700 rounded-md overflow-hidden mr-3">
                            <img
                              src={song.thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate text-white">
                              {song.title}
                            </div>
                            <div className="text-gray-300 text-xs truncate">
                              {song.subtitle}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(song, 0);
                          }}
                          className="ml-2 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart size={16} fill="currentColor" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Player Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 transition-all duration-500 ease-in-out ${currentSong ? "translate-y-0" : "translate-y-full"
          }`}
      >
        <div className="bg-black/90 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col">
            {currentSong && (
              <>
                <div
                  onClick={handleSeek}
                  className="h-1.5 w-full bg-gray-700/50 cursor-pointer relative group"
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center max-w-[40%] md:max-w-[30%]">
                    <div className="relative w-12 h-12 bg-gray-700 rounded-md overflow-hidden mr-3 flex-shrink-0">
                      <img
                        src={currentSong.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {playerState.isBuffering && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader className="animate-spin h-6 w-6 text-fuchsia-500" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate text-white">
                        {currentSong.title}
                      </div>
                      <div className="text-gray-300 text-sm truncate">
                        {currentSong.subtitle}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(currentSong, 0)}
                      className="ml-3 focus:outline-none transition-transform active:scale-90"
                    >
                      <Heart
                        size={18}
                        className={
                          isFavorite(currentSong.id)
                            ? "text-red-500 fill-red-500"
                            : "text-gray-400 hover:text-red-400"
                        }
                      />
                    </button>
                  </div>

                  {/* Player Controls - now with improved loading indicators */}
                  <div className="flex items-center space-x-3 md:space-x-5">
                    <button
                      onClick={playPreviousSong}
                      className="text-gray-300 hover:text-white transition-colors"
                      disabled={playerState.isBuffering}
                    >
                      <SkipBack
                        size={20}
                        className={playerState.isBuffering ? "opacity-50" : ""}
                      />
                    </button>
                    <button
                      onClick={togglePlayPause}
                      disabled={playerState.isBuffering}
                      className={`rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-all ${playerState.isBuffering
                        ? "bg-gray-700 cursor-wait"
                        : "bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 hover:scale-105"
                        }`}
                    >
                      {playerState.isBuffering ? (
                        <Loader className="animate-spin h-5 w-5" />
                      ) : isPlaying ? (
                        <Pause size={22} />
                      ) : (
                        <Play size={22} fill="white" />
                      )}
                    </button>
                    <button
                      onClick={playNextSong}
                      className="text-gray-300 hover:text-white transition-colors"
                      disabled={playerState.isBuffering}
                    >
                      <SkipForward
                        size={20}
                        className={playerState.isBuffering ? "opacity-50" : ""}
                      />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 md:space-x-3 max-w-[40%] md:max-w-[30%]">
                    <div className="hidden sm:flex space-x-2 text-sm text-gray-300 min-w-[80px] md:min-w-[100px] justify-end">
                      <span>{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div className="hidden sm:flex items-center space-x-2">
                      <button
                        onClick={toggleMute}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {volume === 0 || isMuted ? (
                          <VolumeX size={18} />
                        ) : (
                          <Volume2 size={18} />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 md:w-20 accent-fuchsia-500"
                      />
                    </div>
                    <button
                      onClick={() => openDrawer("playlists")}
                      className="block lg:hidden p-1 text-gray-300 hover:text-white rounded-full bg-white/10"
                      aria-label="Search Results"
                    >
                      <Menu size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
            {currentSong && (
              <div className=" sm:hidden flex items-center justify-center space-x-3 w-full p-2">
                <div className="space-x-2 text-sm text-gray-300 min-w-[80px] justify-end">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {volume === 0 || isMuted ? (
                      <VolumeX size={18} />
                    ) : (
                      <Volume2 size={18} />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-fuchsia-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={drawer.isOpen}
        onClose={() => setDrawer((prev) => ({ ...prev, isOpen: false }))}
        activeTab={
          drawer.activeTab == "search" ? "playlists" : drawer.activeTab
        }
        setActiveTab={(tab) =>
          setDrawer((prev) => ({ ...prev, activeTab: tab }))
        }
        playlists={playlists}
        favorites={favorites}
        setDrawer={setDrawer}
        currentSongIndex={currentSongIndex}
        setCurrentSongIndex={setCurrentSongIndex}
        isPlaying={isPlaying}
        onAddPlaylist={(newPlaylist) =>
          setPlaylists((prev) => [...prev, newPlaylist])
        }
        clearSearchResults={() => setSearchResults([])}
        onPlaylistSelect={handlePlaylistSelect}
        onToggleFavorite={toggleFavorite}
      />
      {/* Invisible YouTube iframe for playback */}
      <div ref={iframeRef} className="hidden" />
    </div>
  );
}
