import { useEffect, useRef, useState } from "react";
import {
  Search, Heart, Plus, Music2, Play, Pause,
  SkipBack, SkipForward, Volume2, ListMusic,
  Upload, X
} from "lucide-react";
import "./style.css";

type Track = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  stream: string;
  duration: number;
  file?: boolean;
};

const API = "https://api.audius.co/v1";
const APP_NAME = "MELLUNE";

function mapTrack(item: any): Track {
  return {
    id: String(item.id),
    title: item.title || "Unknown Track",
    artist: item.user?.name || "Unknown Artist",
    artwork:
      item.artwork?.["480x480"] ||
      item.artwork?.["150x150"] ||
      "",
    stream: `${API}/tracks/${item.id}/stream?app_name=${APP_NAME}`,
    duration: item.duration || 0,
  };
}

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mellune-favorites") || "[]");
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<Record<string, Track[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem("mellune-playlists") || "{}");
    } catch {
      return {};
    }
  });

  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("mellune-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("mellune-playlists", JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    loadTracks("");
  }, []);

  useEffect(() => {
    if (!audioRef.current || !current) return;
    audioRef.current.src = current.stream;
    audioRef.current.volume = volume;
    audioRef.current.play()
      .then(() => setPlaying(true))
      .catch(() => {
        setPlaying(false);
        setError("This track could not be played. Try another song.");
      });
  }, [current]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  async function loadTracks(search: string) {
    setLoading(true);
    setError("");

    try {
      const endpoint = search.trim()
        ? `${API}/tracks/search?query=${encodeURIComponent(search)}&limit=25&app_name=${APP_NAME}`
        : `${API}/tracks/trending?limit=25&app_name=${APP_NAME}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Search unavailable");

      const json = await response.json();
      const results = (json.data || [])
        .map(mapTrack)
        .filter((track: Track) => track.id && track.stream);

      setTracks(results);

      if (!results.length) setError("No songs found. Try another search.");
    } catch {
      setError("Could not load songs. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  function searchSongs(e: React.FormEvent) {
    e.preventDefault();
    setShowFavorites(false);
    setShowPlaylists(false);
    loadTracks(query);
  }

  function playTrack(track: Track) {
    setCurrent(track);
    setError("");
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !current) return;

    if (audio.paused) {
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => setError("Could not play this track."));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function toggleFavorite(track: Track) {
    setFavorites((old) =>
      old.some((item) => item.id === track.id)
        ? old.filter((item) => item.id !== track.id)
        : [...old, track]
    );
  }

  function isFavorite(track: Track) {
    return favorites.some((item) => item.id === track.id);
  }

  function createPlaylist() {
    const name = window.prompt("Enter playlist name");
    if (!name?.trim()) return;

    if (playlists[name.trim()]) {
      alert("Playlist already exists.");
      return;
    }

    setPlaylists((old) => ({ ...old, [name.trim()]: [] }));
    setActivePlaylist(name.trim());
    setShowPlaylists(true);
    setShowFavorites(false);
  }

  function addToPlaylist(track: Track) {
    const names = Object.keys(playlists);
    if (!names.length) {
      alert("Create a playlist first.");
      return;
    }

    const name = window.prompt(
      `Enter playlist name:\n${names.join("\n")}`,
      activePlaylist || names[0]
    );

    if (!name || !playlists[name]) {
      alert("Playlist not found.");
      return;
    }

    setPlaylists((old) => ({
      ...old,
      [name]: old[name].some((item) => item.id === track.id)
        ? old[name]
        : [...old[name], track],
    }));
    setActivePlaylist(name);
  }

  function addDeviceMusic(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const localTracks: Track[] = files
      .filter((file) => file.type.startsWith("audio/"))
      .map((file) => ({
        id: `device-${Date.now()}-${file.name}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "From your device",
        artwork: "",
        stream: URL.createObjectURL(file),
        duration: 0,
        file: true,
      }));

    if (localTracks.length) {
      setTracks((old) => [...localTracks, ...old]);
      setShowFavorites(false);
      setShowPlaylists(false);
    }

    e.target.value = "";
  }

  function nextTrack() {
    const list = visibleTracks;
    if (!list.length) return;

    const index = list.findIndex((track) => track.id === current?.id);
    playTrack(list[(index + 1 + list.length) % list.length]);
  }

  function previousTrack() {
    const list = visibleTracks;
    if (!list.length) return;

    const index = list.findIndex((track) => track.id === current?.id);
    playTrack(list[(index - 1 + list.length) % list.length]);
  }

  function formatTime(seconds: number) {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  const visibleTracks = showFavorites
    ? favorites
    : showPlaylists
      ? playlists[activePlaylist] || []
      : tracks;

  return (
    <div className="mellune">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={nextTrack}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />

      <header className="header">
        <div className="brand">
          <span className="brand-icon"><Music2 size={20} /></span>
          <span>MELLUNE</span>
        </div>

        <button
          className={`favorite-top ${showFavorites ? "selected" : ""}`}
          onClick={() => {
            setShowFavorites(!showFavorites);
            setShowPlaylists(false);
          }}
          aria-label="Favorites"
        >
          <Heart size={19} fill={showFavorites ? "currentColor" : "none"} />
        </button>
      </header>

      <main className="home">
        <div className="welcome">
          <p className="eyebrow">YOUR MUSIC SPACE</p>
          <h1>Feel the music.</h1>
          <p>Find your sound. Keep your moments.</p>
        </div>

        <form className="search" onSubmit={searchSongs}>
          <Search size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs or artists..."
          />
          <button type="submit" disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </form>

        <div className="actions">
          <button
            className={`action-button ${showFavorites ? "active" : ""}`}
            onClick={() => {
              setShowFavorites(!showFavorites);
              setShowPlaylists(false);
            }}
          >
            <Heart size={17} />
            Favorites
          </button>

          <button
            className="action-button"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={17} />
            From device
          </button>

          <button className="action-button" onClick={createPlaylist}>
            <Plus size={17} />
            Playlist
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            multiple
            hidden
            onChange={addDeviceMusic}
          />
        </div>

        {Object.keys(playlists).length > 0 && (
          <div className="playlist-strip">
            <span><ListMusic size={16} /> Playlists</span>
            {Object.keys(playlists).map((name) => (
              <button
                key={name}
                className={activePlaylist === name && showPlaylists ? "active" : ""}
                onClick={() => {
                  setActivePlaylist(name);
                  setShowPlaylists(true);
                  setShowFavorites(false);
                }}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <section className="music-section">
          <div className="section-heading">
            <h2>
              {showFavorites
                ? "Your favorites"
                : showPlaylists
                  ? activePlaylist
                  : query.trim()
                    ? "Search results"
                    : "Discover music"}
            </h2>
            <span>{visibleTracks.length} songs</span>
          </div>

          {loading && <p className="message">Finding music...</p>}
          {error && <p className="message">{error}</p>}

          {!loading && visibleTracks.length === 0 && !error && (
            <div className="empty">
              <Music2 size={28} />
              <p>
                {showFavorites
                  ? "Your favorite songs will appear here."
                  : showPlaylists
                    ? "This playlist is empty. Add a song using the + button."
                    : "Search for a song to get started."}
              </p>
            </div>
          )}

          <div className="track-list">
            {visibleTracks.map((track, index) => (
              <div
                className={`track-row ${current?.id === track.id ? "is-playing" : ""}`}
                key={track.id}
              >
                <button
                  className="track-play"
                  onClick={() => current?.id === track.id ? togglePlay() : playTrack(track)}
                  aria-label="Play song"
                >
                  {current?.id === track.id && playing
                    ? <Pause size={17} />
                    : <Play size={17} />}
                </button>

                <div className="cover">
                  {track.artwork
                    ? <img src={track.artwork} alt="" />
                    : <Music2 size={20} />}
                </div>

                <button className="track-info" onClick={() => playTrack(track)}>
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                </button>

                <button
                  className={`icon-button ${isFavorite(track) ? "liked" : ""}`}
                  onClick={() => toggleFavorite(track)}
                  aria-label="Favorite"
                >
                  <Heart size={18} fill={isFavorite(track) ? "currentColor" : "none"} />
                </button>

                <button
                  className="icon-button add-track"
                  onClick={() => addToPlaylist(track)}
                  aria-label="Add to playlist"
                >
                  <Plus size={19} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {current && (
        <footer className="player">
          <div className="now-playing">
            <div className="player-cover">
              {current.artwork
                ? <img src={current.artwork} alt="" />
                : <Music2 size={20} />}
            </div>
            <div className="player-info">
              <strong>{current.title}</strong>
              <span>{current.artist}</span>
            </div>
          </div>

          <div className="player-controls">
            <div className="control-buttons">
              <button onClick={previousTrack} aria-label="Previous">
                <SkipBack size={19} />
              </button>
              <button className="main-play" onClick={togglePlay} aria-label="Play or pause">
                {playing ? <Pause size={19} /> : <Play size={19} />}
              </button>
              <button onClick={nextTrack} aria-label="Next">
                <SkipForward size={19} />
              </button>
            </div>

            <div className="progress-area">
              <span>{formatTime(progress)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={Math.min(progress, duration || 100)}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = value;
                  setProgress(value);
                }}
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="volume-control">
            <Volume2 size={18} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </div>
        </footer>
      )}
    </div>
  );
}
