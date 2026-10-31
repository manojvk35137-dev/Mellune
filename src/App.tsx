
import { useEffect, useRef, useState } from "react";
import {
  Home, Search, Heart, Library, Radio, Play, Pause, SkipBack, SkipForward,
  Volume2, Plus, Upload, Music2, MoonStar, Headphones, Sparkles
} from "lucide-react";

type Track = {
  id: string;
  title: string;
  artist: string;
  mood: string;
  color: string;
  artwork?: string;
  src: string;
};

const API = "https://api.audius.co/v1";
const APP_NAME = "MELLUNE";

const colors = ["art-one", "art-two", "art-three", "art-four", "art-five"];

function mapTrack(item: any, index: number): Track {
  return {
    id: String(item.id),
    title: item.title || "Unknown track",
    artist: item.user?.name || "Unknown artist",
    mood: item.genre || "Music",
    color: colors[index % colors.length],
    artwork:
      item.artwork?.["480x480"] ||
      item.artwork?.["150x150"] ||
      undefined,
    src: `${API}/tracks/${encodeURIComponent(item.id)}/stream?app_name=${APP_NAME}`
  };
}

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState("Home");
  const [query, setQuery] = useState("");
  const [liked, setLiked] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [myTracks, setMyTracks] = useState<Track[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTracks = async (search = "") => {
    setLoading(true);
    setError("");

    try {
      const endpoint = search.trim()
        ? `${API}/tracks/search?query=${encodeURIComponent(search)}&limit=25&app_name=${APP_NAME}`
        : `${API}/tracks/trending?limit=25&app_name=${APP_NAME}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Music service is temporarily unavailable.");
      }

      const result = await response.json();
      const items = Array.isArray(result.data) ? result.data : [];

      const found = items
        .filter((item: any) => item.id && item.title)
        .map((item: any, index: number) => mapTrack(item, index));

      setTracks(found);

      if (found.length === 0) {
        setError("No songs found. Try another search.");
      }
    } catch {
      setTracks([]);
      setError("Could not load music. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      if (tab !== "Liked Songs") {
        fetchTracks(query);
      }
    }, 500);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const onTime = () => setProgress(audio.currentTime || 0);
    const onDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => nextTrack();

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [volume, current, tracks]);

  useEffect(() => {
    if (!current || !audioRef.current) return;

    const audio = audioRef.current;
    audio.src = current.src;
    audio.load();

    if (playing) {
      audio.play().catch(() => {
        setPlaying(false);
        setError("This track could not be played. Try another song.");
      });
    }
  }, [current]);

  useEffect(() => {
    if ("mediaSession" in navigator && current) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: "MELLUNE",
        artwork: current.artwork
          ? [{ src: current.artwork, sizes: "480x480", type: "image/jpeg" }]
          : []
      });

      navigator.mediaSession.setActionHandler("play", () => {
        audioRef.current?.play().then(() => setPlaying(true)).catch(() => {});
      });

      navigator.mediaSession.setActionHandler("pause", () => {
        audioRef.current?.pause();
        setPlaying(false);
      });

      navigator.mediaSession.setActionHandler("nexttrack", nextTrack);
      navigator.mediaSession.setActionHandler("previoustrack", previousTrack);
    }
  }, [current, tracks]);

  const playTrack = (track: Track) => {
    setError("");
    setCurrent(track);
    setPlaying(true);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !current) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false);
          setError("Unable to play this track. Try another one.");
        });
    }
  };

  const nextTrack = () => {
    const list = tab === "Liked Songs"
      ? tracks.filter(t => liked.includes(t.id))
      : tracks;

    if (!list.length) return;

    const index = list.findIndex(t => t.id === current?.id);
    playTrack(list[(index + 1) % list.length]);
  };

  const previousTrack = () => {
    const list = tab === "Liked Songs"
      ? tracks.filter(t => liked.includes(t.id))
      : tracks;

    if (!list.length) return;

    const index = list.findIndex(t => t.id === current?.id);
    playTrack(list[(index - 1 + list.length) % list.length]);
  };

  const uploadAudio = (file?: File) => {
    if (!file) return;

    const track: Track = {
      id: `local-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ""),
      artist: "Your device",
      mood: "My music",
      color: "art-five",
      src: URL.createObjectURL(file)
    };

    setMyTracks(old => [track, ...old]);
    playTrack(track);
  };

  const toggleLike = (id: string) => {
    setLiked(old =>
      old.includes(id) ? old.filter(x => x !== id) : [...old, id]
    );
  };

  const visibleTracks =
    tab === "Liked Songs"
      ? tracks.filter(t => liked.includes(t.id))
      : tab === "Your Library"
        ? myTracks
        : tracks;

  const fmt = (n: number) =>
    `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;

  return (
    <div className="app-shell">
      <audio ref={audioRef} />

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><MoonStar size={23} /></div>
          <span>mellune<span className="brand-dot">.</span></span>
        </div>

        <div className="side-label">MENU</div>

        {[
          ["Home", Home],
          ["Explore", Search],
          ["Your Library", Library],
          ["Listen Together", Radio]
        ].map(([name, Icon]: any) => (
          <button
            key={name}
            className={`nav-item ${tab === name ? "active" : ""}`}
            onClick={() => {
              setTab(name as string);
              if (name === "Explore") fetchTracks(query);
              if (name === "Home") {
                setQuery("");
                fetchTracks();
              }
            }}
          >
            <Icon size={19} />
            <span>{name}</span>
          </button>
        ))}

        <div className="side-label playlist-label">YOUR SPACE</div>

        <button className="nav-item" onClick={() => setTab("Liked Songs")}>
          <Heart size={19} /><span>Liked Songs</span>
        </button>

        <button className="nav-item" onClick={() => fileRef.current?.click()}>
          <Plus size={19} /><span>Add your music</span>
        </button>

        <div className="sidebar-note">
          <Sparkles size={16} />
          <p>Every song has a story. Make yours.</p>
        </div>

        <div className="profile">
          <div className="avatar">M</div>
          <div><b>Music lover</b><small>Your personal space</small></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand"><MoonStar size={20} /> mellune.</div>

          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setTab("Explore");
              }}
              placeholder="Search songs, artists, moods..."
            />
          </div>

          <button className="upload-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /><span>Upload music</span>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={e => {
              uploadAudio(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow">YOUR LITTLE MUSIC UNIVERSE</p>
            <h1>Find your <em>feeling.</em></h1>
            <p className="welcome-sub">
              A little music for whatever your heart is feeling today.
            </p>
          </div>

          <div className="orbit-art">
            <div className="orbit-ring"></div>
            <div className="orbit-moon">♫</div>
            <span className="star star-a">✦</span>
            <span className="star star-b">✧</span>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PICK YOUR FEELING</p>
              <h2>Music moods</h2>
            </div>
            <span className="soft-caption">What feels like you?</span>
          </div>

          <div className="mood-grid">
            {[
              ["☁", "Cloud nine", "mood-lilac", "Dreamy"],
              ["☾", "Midnight", "mood-blue", "Chill"],
              ["♡", "Heartstrings", "mood-pink", "Love"],
              ["✧", "Good energy", "mood-gold", "Happy"]
            ].map(([symbol, label, cls, search]) => (
              <button
                key={label}
                className={`mood-card ${cls}`}
                onClick={() => {
                  setQuery(search);
                  setTab("Explore");
                }}
              >
                <span>{symbol}</span>
                <b>{label}</b>
                <small>Explore the feeling</small>
              </button>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {tab === "Liked Songs" ? "YOUR COLLECTION" : "DISCOVER MUSIC"}
              </p>
              <h2>
                {tab === "Liked Songs"
                  ? "Your favourites"
                  : tab === "Explore"
                    ? "Explore music"
                    : tab === "Your Library"
                      ? "Your library"
                      : "Trending music"}
              </h2>
            </div>

            <button className="text-btn" onClick={() => {
              setTab("Explore");
              fetchTracks(query);
            }}>
              See all <span>↗</span>
            </button>
          </div>

          {loading && <div className="empty-state">Finding music for you...</div>}
          {error && <div className="empty-state">{error}</div>}

          <div className="track-list">
            {visibleTracks.map(track => (
              <div
                className={`track-row ${current?.id === track.id ? "selected" : ""}`}
                key={track.id}
              >
                <button
                  className={`track-art ${track.color}`}
                  onClick={() => playTrack(track)}
                >
                  {track.artwork
                    ? <img src={track.artwork} alt="" />
                    : <Music2 size={23} />}
                </button>

                <button className="track-info" onClick={() => playTrack(track)}>
                  <b>{track.title}</b>
                  <small>{track.artist} · {track.mood}</small>
                </button>

                <button
                  className={`like-btn ${liked.includes(track.id) ? "liked" : ""}`}
                  onClick={() => toggleLike(track.id)}
                  aria-label="Like song"
                >
                  <Heart
                    size={18}
                    fill={liked.includes(track.id) ? "currentColor" : "none"}
                  />
                </button>

                <button className="row-play" onClick={() => playTrack(track)}>
                  <Play size={15} fill="currentColor" />
                </button>
              </div>
            ))}

            {!loading && !error && visibleTracks.length === 0 && (
              <div className="empty-state">
                No songs here yet. Search for music or explore trending tracks.
              </div>
            )}
          </div>
        </section>

        <section className="feature-card">
          <div className="feature-icon"><Headphones size={27} /></div>
          <div>
            <p className="eyebrow">YOUR MUSIC, YOUR WAY</p>
            <h3>Discover your next favourite.</h3>
            <p>Search and stream music from Audius inside MELLUNE.</p>
          </div>
          <button
            onClick={() => {
              setTab("Explore");
              fetchTracks(query);
            }}
            className="feature-action"
          >
            Explore music <span>→</span>
          </button>
        </section>

        <footer>Made with ♡ for music lovers <span>·</span> MELLUNE</footer>
      </main>

      <div className="player-bar">
        <div className="now-playing">
          <div className={`mini-art ${current?.color || "art-one"}`}>
            {current?.artwork
              ? <img src={current.artwork} alt="" />
              : <Music2 size={19} />}
          </div>
          <div>
            <b>{current?.title || "Choose a song"}</b>
            <small>{current?.artist || "MELLUNE music"}</small>
          </div>
          {current && (
            <button
              className={`like-btn ${liked.includes(current.id) ? "liked" : ""}`}
              onClick={() => toggleLike(current.id)}
            >
              <Heart
                size={17}
                fill={liked.includes(current.id) ? "currentColor" : "none"}
              />
            </button>
          )}
        </div>

        <div className="player-center">
          <div className="player-controls">
            <button title="Previous" onClick={previousTrack}>
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button className="main-play" onClick={togglePlay} disabled={!current}>
              {playing
                ? <Pause size={19} fill="currentColor" />
                : <Play size={19} fill="currentColor" />}
            </button>
            <button title="Next" onClick={nextTrack}>
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>

          <div className="progress-line">
            <span>{fmt(progress)}</span>
            <input
              aria-label="Playback position"
              type="range"
              min="0"
              max={duration || 100}
              value={Math.min(progress, duration || 100)}
              onChange={e => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Number(e.target.value);
                }
              }}
            />
            <span>{duration ? fmt(duration) : "—:—"}</span>
          </div>
        </div>

        <div className="volume">
          <Volume2 size={18} />
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
