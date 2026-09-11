import { useEffect, useRef, useState } from 'react'

interface MusicPlayerProps {
  url?: string
}

// Default wedding song: Một Đời (14 Casper & Bon Nghiêm)
const DEFAULT_MUSIC = '/mot-doi.mp3'

export default function MusicPlayer({ url }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const musicSource = url?.trim() ? url : DEFAULT_MUSIC

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.85

    const tryPlay = () => {
      if (!audio) return
      const promise = audio.play()
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true)
            removeInteractionListeners()
          })
          .catch(() => {
            // Autoplay was blocked by browser; will start on first user tap/scroll
            setIsPlaying(false)
          })
      }
    }

    // 1. Attempt immediate autoplay on mount
    tryPlay()

    // 2. Also attempt autoplay once audio can play
    audio.addEventListener('canplay', tryPlay, { once: true })

    // 3. Browser policy fallback: play on first user interaction (touch, scroll, click)
    const onUserInteraction = () => {
      tryPlay()
    }

    const events = [
      'click',
      'touchstart',
      'touchend',
      'touchmove',
      'scroll',
      'pointerdown',
      'keydown',
    ]

    events.forEach((evt) => {
      window.addEventListener(evt, onUserInteraction, { capture: true, passive: true })
      document.addEventListener(evt, onUserInteraction, { capture: true, passive: true })
    })

    const removeInteractionListeners = () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, onUserInteraction, { capture: true })
        document.removeEventListener(evt, onUserInteraction, { capture: true })
      })
    }

    // 4. Custom event triggered by WeddingGate opening
    const onTriggerMusic = () => {
      tryPlay()
    }
    window.addEventListener('wedding:play-music', onTriggerMusic)

    return () => {
      removeInteractionListeners()
      audio.removeEventListener('canplay', tryPlay)
      window.removeEventListener('wedding:play-music', onTriggerMusic)
    }
  }, [musicSource])

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
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
      <audio
        ref={audioRef}
        src={musicSource}
        autoPlay
        loop
        playsInline
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <button
        type="button"
        className={`music-btn ${isPlaying ? 'playing' : ''}`}
        onClick={toggle}
        aria-label={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
        title={isPlaying ? 'Tắt nhạc (Một Đời)' : 'Bật bài hát "Một Đời"'}
      >
        <div className="music-icon-wrap">
          <span className="music-disc">💿</span>
          {isPlaying ? (
            <div className="music-bars" aria-hidden="true">
              <span className="mbar mb1" />
              <span className="mbar mb2" />
              <span className="mbar mb3" />
            </div>
          ) : (
            <span className="music-note-muted">🔇</span>
          )}
        </div>
      </button>

      {/* Song title banner */}
      <div className={`music-song-tag ${isPlaying ? 'playing' : ''}`}>
        <span className="song-dot" />
        <span className="song-title">Một Đời • 14 Casper & Bon</span>
      </div>
    </div>
  )
}
