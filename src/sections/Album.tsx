import { useCallback, useEffect, useState } from 'react'
import { useConfigStore } from '../store'

export default function Album() {
  const { config } = useConfigStore()
  const [index, setIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})
  const photos = config.album

  const close = useCallback(() => setIndex(null), [])
  const step = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length]
  )

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, close, step])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const distance = touchStart - touchEnd
    if (distance > 50) step(1)
    if (distance < -50) step(-1)
    setTouchStart(null)
  }

  const handleImageLoad = (src: string) => {
    setLoadedImages(prev => ({ ...prev, [src]: true }))
  }

  return (
    <section id="album" className="section">
      <div className="section-head reveal">
        <h2>Album Ảnh Cưới</h2>
        <div className="section-rule" />
        <p>Những khoảnh khắc đáng nhớ trên hành trình về chung một nhà.</p>
      </div>

      {photos.length === 0 ? (
        <p className="album-empty reveal">
          Chưa có ảnh nào. Vào trang <code>/config</code> → tab <strong>Album</strong> để tải ảnh lên.
        </p>
      ) : (
        <div className="album-grid reveal">
          {photos.map((src) => (
            <button key={src} className="album-cell" onClick={() => setIndex(photos.indexOf(src))}>
              {!loadedImages[src] && <div className="image-skeleton" />}
              <img 
                src={src} 
                alt="Ảnh cưới" 
                loading="lazy" 
                onLoad={() => handleImageLoad(src)}
                style={{ opacity: loadedImages[src] ? 1 : 0, transition: 'opacity 0.3s ease' }}
              />
            </button>
          ))}
        </div>
      )}

      {index !== null && (
        <div 
          className="lightbox fade-in" 
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="lb-close" onClick={close} aria-label="Đóng">
            ✕
          </button>
          <button
            className="lb-nav prev"
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            aria-label="Ảnh trước"
          >
            ‹
          </button>
          <img
            key={photos[index]}
            className="lb-image fade-image"
            src={photos[index]}
            alt={`Ảnh cưới ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="lb-nav next"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            aria-label="Ảnh sau"
          >
            ›
          </button>
          <span className="lb-counter">
            {index + 1} / {photos.length}
          </span>
        </div>
      )}
    </section>
  )
}
