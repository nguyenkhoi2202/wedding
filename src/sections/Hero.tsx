import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConfigStore } from '../store'
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar'

export default function Hero() {
  const { config } = useConfigStore()
  const [searchParams] = useSearchParams()
  const [showCalMenu, setShowCalMenu] = useState(false)

  const sideParam = searchParams.get('side') || searchParams.get('party')
  const isGroom = sideParam === 'groom' || sideParam === 'nha-trai' || sideParam === 'tanhon'
  const isBride = sideParam === 'bride' || sideParam === 'nha-gai' || sideParam === 'vuquy'
  const activeParty = isGroom ? config.groomParty : isBride ? config.brideParty : null
  const heroDateStr = activeParty
    ? `${activeParty.weekday} • ${activeParty.date}`
    : `${config.eventWeekday} • ${config.eventDate}`

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleGoogleCal = () => {
    setShowCalMenu(false)
    const activeDate = activeParty?.date || config.eventDate
    const activeTime = activeParty?.time || config.eventTime
    const activeVenue = activeParty?.venueName || config.venueName
    const activeAddress = activeParty?.venueAddress || config.venueAddress
    const activeTitle = activeParty?.title || 'Lễ Cưới'

    const url = getGoogleCalendarUrl({
      title: `${activeTitle}: ${config.groomName} & ${config.brideName}`,
      details: `${config.invitationIntro}\n${config.invitationMessage}`,
      location: `${activeVenue}, ${activeAddress}`,
      dateStr: activeDate,
      timeStr: activeTime,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleIcsCal = () => {
    setShowCalMenu(false)
    downloadIcsFile({
      title: `Lễ Cưới: ${config.groomName} & ${config.brideName}`,
      details: `${config.invitationIntro}\n${config.invitationMessage}`,
      location: `${config.venueName}, ${config.venueAddress}`,
      dateStr: config.eventDate,
      timeStr: config.eventTime,
    })
  }

  return (
    <section id="home" className="section hero">
      <div className="particles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className={`petal petal-${(i % 5) + 1}`}
            style={{
              left: `${(i * 8.5) + (i % 2 ? 3 : 0)}%`,
              animationDelay: `${(i * 0.7) % 6}s`,
              animationDuration: `${12 + (i % 4) * 2}s`,
            }}
          >
            🌸
          </span>
        ))}
      </div>

      {/* Save the date badge */}
      <div className="hero-save-badge">
        <span className="badge-sparkle">✧</span>
        <span>SAVE THE DATE</span>
        <span className="badge-sparkle">✧</span>
      </div>

      {/* Romantic script kicker */}
      <p className="hero-script-kicker">The Wedding of</p>

      {/* Main Title */}
      <h1 className="hero-title">{config.heroTitle}</h1>

      {/* Delicate floral divider */}
      <div className="hero-ornament">
        <span className="ornament-line" />
        <span className="ornament-icon">❦</span>
        <span className="ornament-line" />
      </div>

      {/* Couple Avatars with interlocking rings / hearts */}
      <div className="hero-couple">
        <figure className="hero-avatar groom">
          <div className="avatar-frame">
            {config.groomImage ? (
              <img src={config.groomImage} alt={config.groomName} />
            ) : (
              <span className="avatar-placeholder">🤵</span>
            )}
            <div className="photo-flourish" />
          </div>
          <figcaption>{config.groomName}</figcaption>
          <span className="hero-role-pill groom-pill">Chú Rể</span>
        </figure>

        <div className="hero-hearts" aria-hidden="true">
          <span className="heart-pulse">💗</span>
          <span className="rings-icon">💍</span>
        </div>

        <figure className="hero-avatar bride">
          <div className="avatar-frame">
            {config.brideImage ? (
              <img src={config.brideImage} alt={config.brideName} />
            ) : (
              <span className="avatar-placeholder">👰</span>
            )}
            <div className="photo-flourish" />
          </div>
          <figcaption>{config.brideName}</figcaption>
          <span className="hero-role-pill bride-pill">Cô Dâu</span>
        </figure>
      </div>

      {/* Event date badge */}
      <div className="hero-date">
        <span className="date-icon">🗓️</span>
        <p>{heroDateStr}</p>
      </div>

      {/* Subtitle */}
      <p className="hero-sub">{config.heroSubtitle}</p>

      {/* Action Buttons */}
      <div className="hero-actions">
        <button
          type="button"
          className="btn btn-primary hero-btn-rsvp"
          onClick={() => go('rsvp')}
        >
          <span>✉️ Xác Nhận Tham Dự</span>
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => go('invitation')}
        >
          <span>💌 Xem Thiệp Mời</span>
        </button>

        {/* Save to Calendar Button */}
        <div className="cal-dropdown-wrap">
          <button
            type="button"
            className="btn btn-calendar"
            onClick={() => setShowCalMenu(!showCalMenu)}
            aria-expanded={showCalMenu}
          >
            <span>📅 Lưu Vào Lịch</span>
          </button>

          {showCalMenu && (
            <div className="cal-dropdown-menu fade-in">
              <button type="button" onClick={handleGoogleCal}>
                <span className="cal-opt-icon">📅</span> Google Calendar
              </button>
              <button type="button" onClick={handleIcsCal}>
                <span className="cal-opt-icon">🍏</span> Apple / Outlook (.ics)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Scroll Down Prompt */}
      <button
        type="button"
        className="hero-scroll"
        onClick={() => go('couple')}
        aria-label="Cuộn xuống xem tiếp"
      >
        <span>Chạm để xem tiếp</span>
        <span className="hero-arrow">↓</span>
      </button>
    </section>
  )
}
