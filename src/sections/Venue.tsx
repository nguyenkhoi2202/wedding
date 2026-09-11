import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConfigStore } from '../store'

export default function Venue() {
  const { config } = useConfigStore()
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)

  // Personalized guest name from URL if provided (e.g. ?to=Anh+Tuấn hoặc ?guest=...)
  const guestQueryName = searchParams.get('to') || searchParams.get('guest')
  const recipientName = guestQueryName?.trim() || config.guestName || 'Quý Khách'

  const fullAddress = `${config.venueName} - ${config.venueAddress}`
  
  // Google Maps Direct Navigation (opens directions directly)
  const googleDirectionsUrl =
    config.venueMapUrl ||
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`

  // Apple Maps (iPhone native directions)
  const appleMapsUrl = `maps://?daddr=${encodeURIComponent(fullAddress)}`

  // Grab Rides Direct Link
  const grabUrl = `https://grab.onelink.me/2695613898?pid=wedding&af_dp=grab%3A%2F%2Fopen%3FscreenType%3DTRANSPORT`

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(config.venueAddress).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2600)
    })
  }

  // Google Maps Embed URL
  const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  return (
    <section id="venue" className="section venue-section">
      <div className="section-head reveal">
        <p className="section-script-subtitle">Wedding Location</p>
        <h2>Địa Điểm Tổ Chức</h2>
        <div className="section-rule" />
        <p className="section-description">
          Thân mời Quý Khách đến tham dự và nâng ly chúc phúc cùng gia đình chúng tôi tại{' '}
          {config.groomHometown} và {config.brideHometown}.
        </p>
      </div>

      {/* Main Venue Card with 1-Touch Navigation */}
      <article className="venue-card card reveal">
        <div className="venue-icon-wrapper">
          <span className="venue-icon bounce">📍</span>
        </div>

        <span className="venue-badge">{config.eventBadge}</span>
        <h3 className="venue-name">{config.venueName}</h3>

        <p className="venue-address">
          <span>🏠</span> {config.venueAddress}
        </p>

        {/* Copy Address Pill */}
        <div className="venue-copy-wrap">
          <button
            type="button"
            className={`venue-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopyAddress}
            title="Sao chép địa chỉ vào bộ nhớ tạm"
          >
            <span>{copied ? '✓ Đã sao chép địa chỉ!' : '📋 Sao chép địa chỉ'}</span>
          </button>
        </div>

        <div className="venue-time-pill">
          <span className="time-clock">⏰</span>
          <div className="time-details">
            <strong>{config.eventTime} • {config.eventWeekday}</strong>
            <span>Ngày {config.eventDate}</span>
          </div>
          {config.eventLunarDate && (
            <small className="venue-lunar">({config.eventLunarDate})</small>
          )}
        </div>

        {/* Embedded Interactive Map Preview */}
        <div className="venue-map-embed-wrapper">
          <iframe
            title="Bản đồ địa điểm tổ chức tiệc cưới"
            src={embedMapUrl}
            className="venue-map-iframe"
            loading="lazy"
            allowFullScreen
          />
          <div className="venue-map-pin-overlay">
            <span className="pin-pulse">📍</span>
            <span className="pin-label">{config.venueName}</span>
          </div>
        </div>

        {/* 1-TOUCH DIRECT NAVIGATION ACTION BUTTONS */}
        <div className="venue-actions-1touch">
          <p className="actions-guide-label">CHỈ ĐƯỜNG 1 CHẠM</p>

          <div className="nav-buttons-grid">
            {/* Google Maps Directions */}
            <a
              className="btn-nav-touch google-nav"
              href={googleDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nav-btn-icon">🗺️</span>
              <div className="nav-btn-text">
                <strong>Google Maps</strong>
                <small>Chỉ đường trực tiếp</small>
              </div>
            </a>

            {/* Apple Maps for iOS */}
            <a
              className="btn-nav-touch apple-nav"
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nav-btn-icon">🍏</span>
              <div className="nav-btn-text">
                <strong>Apple Maps</strong>
                <small>Dành cho iPhone</small>
              </div>
            </a>

            {/* Grab Ride */}
            <a
              className="btn-nav-touch grab-nav"
              href={grabUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="nav-btn-icon">🚕</span>
              <div className="nav-btn-text">
                <strong>Đặt Xe Grab</strong>
                <small>Đi thẳng tới tiệc</small>
              </div>
            </a>
          </div>
        </div>

        {config.venueNotes && (
          <div className="venue-notes card">
            <div className="venue-notes-title">
              <span>✨</span> Lưu ý khi tham dự
            </div>
            <ul>
              {config.venueNotes.split('\n').map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </article>

      {/* Elegant Invitation Envelope Note */}
      <div className="invite-note-wrapper reveal">
        <div className="invite-note card animated-envelope">
          <div className="envelope-flap" />
          <div className="envelope-seal">💌</div>

          <h4 className="invite-note-title">Thư Mời Chung Vui</h4>

          <div className="invite-note-inner">
            <p className="invite-recipient">
              Trân trọng kính mời:{' '}
              <strong className="recipient-highlight">{recipientName}</strong>
            </p>
            <div className="invite-divider">❀ ─── ❦ ─── ❀</div>
            <p className="invite-message">{config.invitationMessage}</p>
          </div>
        </div>
      </div>

      {/* Timeline of Wedding Events */}
      <div className="timeline-block">
        <div className="section-head reveal">
          <p className="section-script-subtitle">Wedding Schedule</p>
          <h2>Lịch Trình Hôn Lễ</h2>
          <div className="section-rule" />
        </div>

        <ol className="timeline">
          {config.timeline.map((item, i) => (
            <li
              key={item.id}
              className={`timeline-row reveal fade-slide-up ${i % 2 ? 'left' : 'right'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="timeline-dot" />
              <div className="timeline-card card">
                <div className="timeline-chip-wrap">
                  <span className="timeline-chip">
                    ⏰ {item.time} {item.date ? `• ${item.date}` : ''}
                  </span>
                </div>
                <h4 className="timeline-title">{item.title}</h4>
                {item.note && <p className="timeline-note">{item.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
