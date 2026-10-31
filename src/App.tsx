import { useEffect, useRef, useState } from "react";
import {
  Home, Search, Heart, Library, Radio, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Volume2, Plus, Upload, Music2, MoonStar, ListMusic,
  Headphones, Sparkles
} from "lucide-react";

type Track = { id: number; title: string; artist: string; mood: string; color: string; src?: string };

const starterTracks: Track[] = [
  { id: 1, title: "Moonlit Memories", artist: "Mellune Radio", mood: "Dreamy", color: "art-one" },
  { id: 2, title: "Velvet Skies", artist: "Indie Nights", mood: "Chill", color: "art-two" },
  { id: 3, title: "Little Sparks", artist: "The Daydreamers", mood: "Happy", color: "art-three" },
  { id: 4, title: "After the Rain", artist: "Soft Signals", mood: "Peaceful", color: "art-four" },
];

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(starterTracks);
  const [current, setCurrent] = useState<Track>(starterTracks[0]);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState("Home");
  const [query, setQuery] = useState("");
  const [liked, setLiked] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!current.src || !audioRef.current) return;
    audioRef.current.src = current.src;
    if (playing) audioRef.current.play().catch(() => setPlaying(false));
  }, [current]);

  const playTrack = (track: Track) => {
    setCurrent(track);
    setPlaying(true);
    if (track.src && audioRef.current) {
      audioRef.current.src = track.src;
      audioRef.current.play().catch(() => setPlaying(false));
    } else {
      setPlaying(false);
      alert("This is a sample preview card. Add your own audio file with the Upload button to play music.");
    }
  };

  const togglePlay = () => {
    if (!current.src) {
      fileRef.current?.click();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };

  const nextTrack = () => {
    const index = tracks.findIndex(t => t.id === current.id);
    setCurrent(tracks[(index + 1) % tracks.length]);
    setPlaying(false);
  };
  const previousTrack = () => {
    const index = tracks.findIndex(t => t.id === current.id);
    setCurrent(tracks[(index - 1 + tracks.length) % tracks.length]);
    setPlaying(false);
  };
  const uploadAudio = (file?: File) => {
    if (!file) return;
    const track: Track = {
      id: Date.now(), title: file.name.replace(/\.[^.]+$/, ""),
      artist: "Your device", mood: "My music", color: "art-five",
      src: URL.createObjectURL(file)
    };
    setTracks(old => [track, ...old]);
    setCurrent(track);
    setPlaying(true);
    setTimeout(() => audioRef.current?.play().catch(() => setPlaying(false)), 100);
  };
  const toggleLike = (id: number) => setLiked(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const visibleTracks = tracks.filter(t => `${t.title} ${t.artist} ${t.mood}`.toLowerCase().includes(query.toLowerCase()));
  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;

  return <div className="app-shell">
    <audio ref={audioRef} />
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><MoonStar size={23}/></div><span>mellune<span className="brand-dot">.</span></span></div>
      <div className="side-label">MENU</div>
      {[
        ["Home", Home], ["Explore", Search], ["Your Library", Library], ["Listen Together", Radio]
      ].map(([name, Icon]: any) => <button key={name} className={`nav-item ${tab === name ? "active" : ""}`} onClick={() => setTab(name)}>
        <Icon size={19}/><span>{name}</span>
      </button>)}
      <div className="side-label playlist-label">YOUR SPACE</div>
      <button className="nav-item" onClick={() => setTab("Liked Songs")}><Heart size={19}/><span>Liked Songs</span></button>
      <button className="nav-item" onClick={() => fileRef.current?.click()}><Plus size={19}/><span>Add your music</span></button>
      <div className="sidebar-note"><Sparkles size={16}/><p>Every song has a story. Make yours.</p></div>
      <div className="profile"><div className="avatar">M</div><div><b>Music lover</b><small>Your personal space</small></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div className="mobile-brand"><MoonStar size={20}/> mellune.</div>
        <div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search songs, artists, moods..." /></div>
        <button className="upload-btn" onClick={() => fileRef.current?.click()}><Upload size={16}/> <span>Upload music</span></button>
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={e => uploadAudio(e.target.files?.[0])}/>
      </header>

      <section className="welcome">
        <div><p className="eyebrow">YOUR LITTLE MUSIC UNIVERSE</p><h1>Find your <em>feeling.</em></h1><p className="welcome-sub">A little music for whatever your heart is feeling today.</p></div>
        <div className="orbit-art"><div className="orbit-ring"></div><div className="orbit-moon">♫</div><span className="star star-a">✦</span><span className="star star-b">✧</span></div>
      </section>

      <section className="section">
        <div className="section-heading"><div><p className="eyebrow">PICK YOUR FEELING</p><h2>Music moods</h2></div><span className="soft-caption">What feels like you?</span></div>
        <div className="mood-grid">
          {[
            ["☁", "Cloud nine", "mood-lilac"], ["☾", "Midnight", "mood-blue"],
            ["♡", "Heartstrings", "mood-pink"], ["✧", "Good energy", "mood-gold"]
          ].map(([symbol, label, cls]) => <button key={label} className={`mood-card ${cls}`} onClick={() => {setQuery(label === "Cloud nine" ? "Dreamy" : label === "Midnight" ? "Chill" : label === "Heartstrings" ? "Peaceful" : "Happy"); setTab("Explore");}}>
            <span>{symbol}</span><b>{label}</b><small>Explore the feeling</small>
          </button>)}
        </div>
      </section>

      <section className="section">
        <div className="section-heading"><div><p className="eyebrow">MADE FOR YOUR MOMENT</p><h2>{tab === "Liked Songs" ? "Your favourites" : tab === "Explore" ? "Explore music" : "A little something for you"}</h2></div><button className="text-btn" onClick={() => setTab("Explore")}>See all <span>↗</span></button></div>
        <div className="track-list">
          {visibleTracks.filter(t => tab !== "Liked Songs" || liked.includes(t.id)).map((track, i) => <div className={`track-row ${current.id === track.id ? "selected" : ""}`} key={track.id}>
            <button className={`track-art ${track.color}`} onClick={() => playTrack(track)}><Music2 size={23}/></button>
            <button className="track-info" onClick={() => playTrack(track)}><b>{track.title}</b><small>{track.artist} · {track.mood}</small></button>
            <button className={`like-btn ${liked.includes(track.id) ? "liked" : ""}`} onClick={() => toggleLike(track.id)} aria-label="Like song"><Heart size={18} fill={liked.includes(track.id) ? "currentColor" : "none"}/></button>
            <button className="row-play" onClick={() => playTrack(track)}><Play size={15} fill="currentColor"/></button>
          </div>)}
          {visibleTracks.length === 0 && <div className="empty-state">No matches yet. Try another search or upload your own music.</div>}
        </div>
      </section>

      <section className="feature-card">
        <div className="feature-icon"><Headphones size={27}/></div>
        <div><p className="eyebrow">YOUR MUSIC, YOUR WAY</p><h3>Bring your own soundtrack.</h3><p>Upload an audio file from your phone and listen inside your Mellune player.</p></div>
        <button onClick={() => fileRef.current?.click()} className="feature-action">Choose music <span>→</span></button>
      </section>
      <footer>Made with ♡ for music lovers <span>·</span> MELLUNE</footer>
    </main>

    <div className="player-bar">
      <div className="now-playing"><div className={`mini-art ${current.color}`}><Music2 size={19}/></div><div><b>{current.title}</b><small>{current.artist}</small></div><button className={`like-btn ${liked.includes(current.id) ? "liked" : ""}`} onClick={() => toggleLike(current.id)}><Heart size={17} fill={liked.includes(current.id) ? "currentColor" : "none"}/></button></div>
      <div className="player-center"><div className="player-controls"><button title="Previous" onClick={previousTrack}><SkipBack size={18} fill="currentColor"/></button><button className="main-play" onClick={togglePlay}>{playing ? <Pause size={19} fill="currentColor"/> : <Play size={19} fill="currentColor"/>}</button><button title="Next" onClick={nextTrack}><SkipForward size={18} fill="currentColor"/></button></div><div className="progress-line"><span>{fmt(progress)}</span><input aria-label="Playback position" type="range" min="0" max={duration || 100} value={Math.min(progress, duration || 100)} onChange={e => {if(audioRef.current) audioRef.current.currentTime = Number(e.target.value);}}/><span>{duration ? fmt(duration) : "—:—"}</span></div></div>
      <div className="volume"><Volume2 size={18}/><input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(Number(e.target.value))}/></div>
    </div>
  </div>;
}
