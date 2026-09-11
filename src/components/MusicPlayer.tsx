import { useEffect, useRef, useState } from 'react'

interface MusicPlayerProps {
  url?: string
}

// Default romantic acoustic piano background melody
const DEFAULT_MUSIC = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-wedding-piano-112191.mp3'

export default function MusicPlayer({ url }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showHint, setShowHint] = useState(true)

  const musicSource = url?.trim() ? url : DEFAULT_MUSIC

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Attempt autoplay if permitted
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true)
          setHasInteracted(true)
          setShowHint(false)
        })
        .catch(() => {
          // Autoplay was blocked by browser; will start on first user interaction
          setIsPlaying(false)
        })
    }

    // Hide hint after 4 seconds
    const timer = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(timer)
  }, [musicSource])

  // Try to play on first user tap anywhere on the page if not playing
  useEffect(() => {
    if (hasInteracted) return

    const handleFirstTouch = () => {
      if (!hasInteracted && audioRef.current && !isPlaying) {
        audioRef.current.play().then(() => {
          setIsPlaying(true)
          setHasInteracted(true)
          setShowHint(false)
        }).catch(() => {})
      }
    }

    window.addEventListener('click', handleFirstTouch, { once: true })
    window.addEventListener('touchstart', handleFirstTouch, { once: true })
    return () => {
      window.removeEventListener('click', handleFirstTouch)
      window.removeEventListener('touchstart', handleFirstTouch)
    }
  }, [hasInteracted, isPlaying])

  const toggle = () => {
    setHasInteracted(true)
    setShowHint(false)
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(console.error)
    }
  }

  return (
    <div className="music-player-container">
      <audio ref={audioRef} src={musicSource} loop preload="auto" />

      {showHint && !isPlaying && (
        <div className="music-hint" onClick={toggle}>
          <span>Bật nhạc nền ♫</span>
        </div>
      )}

      <button
        type="button"
        className={`music-btn ${isPlaying ? 'playing' : ''}`}
        onClick={toggle}
        aria-label={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
        title={isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
      >
        <div className="music-icon-wrap">
          <span className="music-disc">💿</span>
          {isPlaying && (
            <span className="music-note-float">🎵</span>
          )}
        </div>
      </button>
    </div>
  )
}
