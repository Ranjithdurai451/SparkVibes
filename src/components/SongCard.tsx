
import React from "react";
import { Play, Pause, Heart } from "lucide-react";
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
  currentSongId, 
  isFavorite, 
  onPlay, 
  onToggleFavorite 
}: SongCardProps) => {
  const isCurrentSong = currentSongId === song.id;
  
  return (
    <div
      className={`flex flex-col rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg ${
        isPlaying && isCurrentSong
          ? "ring-2 ring-fuchsia-500 shadow-lg shadow-fuchsia-500/20"
          : "glass-card card-hover-effect"
      }`}
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={song.thumbnail}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
          <button 
            onClick={() => onPlay(song)}
            className="w-10 h-10 bg-fuchsia-500/90 rounded-full flex items-center justify-center"
          >
            {isCurrentSong && isPlaying ? (
              <Pause size={20} className="text-white" />
            ) : (
              <Play size={20} fill="white" />
            )}
          </button>
        </div>
        <button 
          onClick={() => onToggleFavorite(song)}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all hover:bg-black/60"
        >
          <Heart 
            size={16} 
            className={isFavorite ? "text-red-500 fill-red-500" : "text-white"} 
          />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 text-white">{song.title}</h3>
        <p className="text-gray-300 text-xs">{song.subtitle}</p>
      </div>
    </div>
  );
};

export default SongCard;
