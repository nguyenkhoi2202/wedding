import { useConfigStore } from '../store'

export default function Hero() {
  const { config } = useConfigStore()

  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section id="home" className="section hero">
      <div className="particles" aria-hidden="true">
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i} className={`petal petal-${i + 1}`} style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${10 + Math.random() * 10}s`
          }}>🌸</span>
        ))}
      </div>

      <div className="hero-save-badge">Save the Date</div>
      <h1 className="hero-title">{config.heroTitle}</h1>
      
      <div className="hero-ornament">
        <span className="ornament-line"></span>
        <span className="ornament-icon">❀</span>
        <span className="ornament-line"></span>
      </div>

      <div className="hero-couple">
        <figure className="hero-avatar groom">
          {config.groomImage ? (
            <img src={config.groomImage} alt={config.groomName} />
          ) : (
            <span>🤵</span>
          )}
          <figcaption>{config.groomName}</figcaption>
        </figure>

        <div className="hero-hearts">
          <span className="heart-pulse">💗</span>
        </div>

        <figure className="hero-avatar bride">
          {config.brideImage ? (
            <img src={config.brideImage} alt={config.brideName} />
          ) : (
            <span>👰</span>
          )}
          <figcaption>{config.brideName}</figcaption>
        </figure>
      </div>

      <div className="hero-date">
        <p>{config.eventDate}</p>
      </div>

      <p className="hero-sub">{config.heroSubtitle}</p>

      <div className="hero-actions">
        <button className="btn btn-primary" onClick={() => go('rsvp')}>
          Xác Nhận Tham Dự
        </button>
        <button className="btn btn-ghost" onClick={() => go('invitation')}>
          Xem Thông Tin
        </button>
      </div>

      <button className="hero-scroll" onClick={() => go('couple')}>
        <span>Cuộn Xuống</span>
        <span className="hero-arrow">⬇️</span>
      </button>
    </section>
  )
}
