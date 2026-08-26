import { useCallback, useEffect, useState } from 'react'
import { useConfigStore } from '../store'

export default function Album() {
  const { config } = useConfigStore()
  const [index, setIndex] = useState<number | null>(null)
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
          {photos.map((src, i) => (
            <button key={i} className="album-cell" onClick={() => setIndex(i)}>
              <img src={src} alt={`Ảnh cưới ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {index !== null && (
        <div className="lightbox" onClick={close}>
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
            className="lb-image"
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
