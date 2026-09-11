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
    if (distance > 45) step(1)
    if (distance < -45) step(-1)
    setTouchStart(null)
  }

  const handleImageLoad = (src: string) => {
    setLoadedImages((prev) => ({ ...prev, [src]: true }))
  }

  return (
    <section id="album" className="section album-section">
      <div className="section-head reveal">
        <p className="section-script-subtitle">Sweet Memories</p>
        <h2>Album Ảnh Cưới</h2>
        <div className="section-rule" />
        <p className="section-description">
          Từng khoảnh khắc ngọt ngào ghi dấu tình yêu trên hành trình chung đôi của chúng mình.
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="album-empty card reveal">
          <span className="album-empty-icon">📷</span>
          <p>Chưa có ảnh trong album.</p>
          <p className="album-empty-sub">
            Chủ thiệp có thể vào trang <code>/config</code> → tab <strong>Album</strong> để tải lên những khoảnh khắc đẹp nhất.
          </p>
        </div>
      ) : (
        <div className="album-grid reveal">
          {photos.map((src, idx) => (
            <button
              key={src}
              type="button"
              className="album-cell"
              onClick={() => setIndex(idx)}
              aria-label={`Xem ảnh cưới ${idx + 1}`}
            >
              {!loadedImages[src] && <div className="image-skeleton" />}
              <img
                src={src}
                alt={`Ảnh cưới ${idx + 1}`}
                loading="lazy"
                onLoad={() => handleImageLoad(src)}
                style={{ opacity: loadedImages[src] ? 1 : 0 }}
              />
              <div className="album-cell-overlay">
                <span className="album-cell-zoom">🔍</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {index !== null && (
        <div
          className="lightbox fade-in"
          onClick={close}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh phóng to"
        >
          {/* Close Button */}
          <button
            type="button"
            className="lb-close"
            onClick={close}
            aria-label="Đóng ảnh"
          >
            ✕
          </button>

          {/* Prev Button */}
          <button
            type="button"
            className="lb-nav prev"
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            aria-label="Ảnh trước"
          >
            ‹
          </button>

          {/* Current Active Image */}
          <div className="lb-image-container" onClick={(e) => e.stopPropagation()}>
            <img
              key={photos[index]}
              className="lb-image fade-image"
              src={photos[index]}
              alt={`Ảnh cưới ${index + 1}`}
            />
          </div>

          {/* Next Button */}
          <button
            type="button"
            className="lb-nav next"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            aria-label="Ảnh tiếp theo"
          >
            ›
          </button>

          {/* Swipe indicator for mobile touch */}
          <div className="swipe-indicator" aria-hidden="true">
            <span>‹ Vuốt ngang để đổi ảnh ›</span>
          </div>

          {/* Counter pill */}
          <span className="lb-counter">
            {index + 1} / {photos.length}
          </span>
        </div>
      )}
    </section>
  )
}
